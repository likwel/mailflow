const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');

const { startScheduledWorkflows, refreshSchedule } = require("../scheduler/workerschedule");
const { sendEmail } = require('../utils/serviceEmail');

const router = express.Router();
const prisma = new PrismaClient();

// ── GET tous les workflows ──────────────────────────
router.get('/workflows', authMiddleware, async (req, res) => {
  try {
    const workflows = await prisma.workflow.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        executions: { orderBy: { startedAt: 'desc' }, take: 1 },
        _count: { select: { executions: true } },
      },
    });
    const enriched = workflows.map(w => ({
      ...w,
      lastExecution: w.executions[0] || null,
      totalRuns: w._count.executions,
    }));
    res.json(enriched);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch workflows: ' + error.message });
  }
});

// ── GET un workflow ─────────────────────────────────
router.get('/workflows/:id', authMiddleware, async (req, res) => {
  try {
    const workflow = await prisma.workflow.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      include: { executions: { orderBy: { startedAt: 'desc' }, take: 5 } },
    });
    if (!workflow) return res.status(404).json({ error: 'Workflow introuvable' });
    res.json(workflow);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch workflow: ' + error.message });
  }
});

// ── POST créer un workflow ──────────────────────────
router.post('/workflows', authMiddleware, async (req, res) => {
  try {
    const { name, description, template, trigger, actions, nodes, edges } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Nom requis' });
    const workflow = await prisma.workflow.create({
      data: {
        userId: req.user.id,
        name: name.trim(),
        description: description?.trim() || null,
        template: template || 'blank',
        trigger: trigger || {},
        actions: actions || [],
        nodes: nodes || [],
        edges: edges || [],
        status: 'draft',
      },
    });
    res.status(201).json(workflow);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create workflow: ' + error.message });
  }
});

// ── PUT mettre à jour un workflow ───────────────────
router.put('/workflows/:id', authMiddleware, async (req, res) => {

  try {
    const { name, description, trigger, actions, nodes, edges, status } = req.body;
    const workflow = await prisma.workflow.update({
      where: { id: req.params.id, userId: req.user.id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(trigger !== undefined && { trigger }),
        ...(actions !== undefined && { actions }),
        ...(nodes !== undefined && { nodes }),
        ...(edges !== undefined && { edges }),
        ...(status !== undefined && { status }),
      },
    });
    refreshSchedule(workflow, prisma, runWorkflow);
    res.json(workflow);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update workflow: ' + error.message });
  }
});

// ── PATCH statut seulement ──────────────────────────
router.patch('/workflows/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['draft', 'active', 'inactive'].includes(status))
      return res.status(400).json({ error: 'Statut invalide' });
    const workflow = await prisma.workflow.update({
      where: { id: req.params.id, userId: req.user.id },
      data: { status },
    });
    refreshSchedule(workflow, prisma, runWorkflow);
    res.json(workflow);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update status: ' + error.message });
  }
});

// ── DELETE ──────────────────────────────────────────
router.delete('/workflows/:id', authMiddleware, async (req, res) => {
  try {
    await prisma.workflow.delete({ where: { id: req.params.id, userId: req.user.id } });
    res.json({ message: 'Workflow supprimé' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete workflow: ' + error.message });
  }
});

// ── POST exécuter un workflow ───────────────────────
router.post('/workflows/:id/run', authMiddleware, async (req, res) => {
  try {
    const workflow = await prisma.workflow.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!workflow) return res.status(404).json({ error: 'Workflow introuvable' });
    if (workflow.status !== 'active')
      return res.status(400).json({ error: 'Le workflow doit être actif' });

    const execution = await prisma.workflowExecution.create({
      data: { workflowId: workflow.id, status: 'running', nodeStatuses: {} },
    });

    runWorkflow(workflow, execution.id).catch(console.error);
    res.json({ executionId: execution.id, status: 'running' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to run workflow: ' + error.message });
  }
});

// ── GET statut exécution (polling) ─────────────────
router.get('/workflows/:id/executions/:execId', authMiddleware, async (req, res) => {
  try {
    const execution = await prisma.workflowExecution.findFirst({
      where: { id: req.params.execId, workflowId: req.params.id },
    });
    if (!execution) return res.status(404).json({ error: 'Exécution introuvable' });
    res.json(execution);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch execution: ' + error.message });
  }
});

/* ════════════════════════════════════════════════════
   ENGINE — exécution des nœuds
════════════════════════════════════════════════════ */
async function runWorkflow(workflow, executionId) {
  const nodes = workflow.nodes || [];
  const edges = workflow.edges || [];
  const nodeStatuses = {};

  // Construire un index des edges pour navigation
  const edgeMap = buildEdgeMap(edges);

  const user = await prisma.user.findUnique({ where: { id: workflow.userId } });

  // Trouver le nœud de départ (trigger ou premier sans parent)
  const startNode =
    nodes.find(n => ['trigger', 'schedule', 'alarm'].includes(n.type)) || nodes[0];

  if (!startNode) {
    await prisma.workflowExecution.update({
      where: { id: executionId },
      data: {
        status: 'error',
        finishedAt: new Date(),
        error: 'Aucun nœud de départ trouvé',
      },
    });
    return;
  }

  // ── Contexte partagé entre tous les nœuds ──────────────────────────────────
  // Chaque nœud peut y lire les résultats des nœuds précédents
  // et y écrire ses propres sorties.
  //
  //  context["outputField"]   → clé définie dans node.config.outputField
  //  context["node_<id>"]     → accès universel par ID de nœud
  //
  // Exemple d'accès dans executeNode() :
  //   const prevResult = node.context?.ai_agent_result;
  // ──────────────────────────────────────────────────────────────────────────
  const context = {
    workflowId: workflow.id,
    executionId,
    startedAt: new Date().toISOString(),
    _user: user,
  };

  try {
    await traverseNodes(
      startNode.id,
      nodes,
      edgeMap,
      nodeStatuses,
      executionId,
      context,       // ← transmis à chaque nœud
    );

    await prisma.workflowExecution.update({
      where: { id: executionId },
      data: {
        status: 'success',
        finishedAt: new Date(),
        nodeStatuses,
      },
    });
  } catch (err) {
    await prisma.workflowExecution.update({
      where: { id: executionId },
      data: {
        status: 'error',
        finishedAt: new Date(),
        nodeStatuses,
        error: err.message,
      },
    });
  }
}

// Construit un map: nodeId → [{ targetId, sourceHandle }]
function buildEdgeMap(edges) {
  const map = {};
  for (const edge of edges) {
    if (!map[edge.source]) map[edge.source] = [];
    map[edge.source].push({ targetId: edge.target, handle: edge.sourceHandle || 'default' });
  }
  return map;
}

// Traverse les nœuds de façon récursive en suivant les edges
async function traverseNodes(nodeId, nodes, edgeMap, nodeStatuses, executionId, context, visited = new Set()) {
  if (visited.has(nodeId)) return;
  visited.add(nodeId);

  const node = nodes.find(n => n.id === nodeId);
  if (!node) return;

  // Attacher le contexte partagé au node AVANT executeNode
  node.context = context;

  nodeStatuses[node.id] = 'running';
  await prisma.workflowExecution.update({
    where: { id: executionId },
    data: { nodeStatuses: { ...nodeStatuses } },
  });

  let conditionResult = null;
  try {
    conditionResult = await executeNode(node);
    nodeStatuses[node.id] = 'success';

    // ── Écrire le résultat dans le contexte partagé ──
    // AVANT d'appeler les nodes suivants
    if (conditionResult !== null && conditionResult !== undefined) {
      const cfg = node.config || {};
      const key = cfg.outputField        // ai_agent
        || cfg.responseVariable          // webhook
        || `${node.type}_result`;        // auto: "webhook_result", "ai_agent_result"…

      context[key] = conditionResult; // accessible par nom de variable
      context[`node_${node.id}`] = conditionResult; // accessible par ID node

      console.log(`[context] "${node.type}" → context["${key}"] =`, JSON.stringify(conditionResult).slice(0, 100));
    }

  } catch (err) {
    nodeStatuses[node.id] = 'error';
    await prisma.workflowExecution.update({
      where: { id: executionId },
      data: { nodeStatuses: { ...nodeStatuses } },
    });
    throw err;
  }

  await prisma.workflowExecution.update({
    where: { id: executionId },
    data: { nodeStatuses: { ...nodeStatuses } },
  });

  if (node.type === 'stop') return;

  const nextEdges = edgeMap[node.id] || [];
  for (const edge of nextEdges) {
    if (node.type === 'condition') {
      const shouldFollow = conditionResult === true ? 'true' : 'false';
      if (edge.handle !== shouldFollow && edge.handle !== 'default') continue;
    }
    if (node.type === 'filter' && conditionResult === false) continue;
    if (node.type === 'split') {
      const splitA = node.config?.splitA ?? 50;
      const goA = Math.random() * 100 < splitA;
      if ((edge.handle === 'a' && !goA) || (edge.handle === 'b' && goA)) continue;
    }

    // Passer le même objet context → le node suivant voit tout
    await traverseNodes(edge.targetId, nodes, edgeMap, nodeStatuses, executionId, context, visited);
  }
}

/* ════════════════════════════════════════════════════
   EXECUTEURS par type de nœud
════════════════════════════════════════════════════ */
async function executeNode(node) {
  const cfg = node.config || {};

  switch (node.type) {

    // ── Déclencheurs (point de départ, pas d'action) ──
    case 'trigger':
    case 'schedule':
      console.log(cfg)
    case 'alarm':
      return null;

    // ── Délai ──────────────────────────────────────────
    case 'delay': {
      const units = { minute: 60_000, hour: 3_600_000, day: 86_400_000, week: 604_800_000 };
      let ms = 0;
      if (cfg.delayType === 'duration') {
        ms = (cfg.duration || 1) * (units[cfg.unit] || 86_400_000);
      } else if (cfg.delayType === 'until_date' && cfg.untilDate) {
        ms = Math.max(0, new Date(cfg.untilDate) - Date.now());
      }
      await new Promise(r => setTimeout(r, Math.min(ms, 5_000))); // max 5s en dev
      return null;
    }

    // ── Email ───────────────────────────────────────────
    case 'email':
      {
        try {

          // ── Résoudre les destinataires depuis config.recipients ─────────────────
          // recipients = [{ type: "list"|"contact", id, label }]
          const toAddresses = [];

          for (const r of cfg.recipients || []) {
            if (r.type === "list") {
              // Récupérer tous les contacts de la liste
              const listContacts = await prisma.contactListMember.findMany({
                where: { listId: r.id },
                include: { contact: { select: { email: true } } },
              });
              listContacts.forEach(m => { if (m.contact?.email) toAddresses.push(m.contact.email); });

            } else if (r.type === "contact") {
              const contact = await prisma.contact.findUnique({
                where: { id: r.id },
                select: { email: true },
              });
              if (contact?.email) toAddresses.push(contact.email);
            }
          }

          if (toAddresses.length === 0) throw new Error("Aucun destinataire résolu pour le nœud email");

          // ── Appel fonction réutilisable ──────────────────────────────────────────
          const result = await sendEmail({
            user: node.context._user,   // user attaché au contexte d'exécution
            to: toAddresses,
            templateId: cfg.templateId || undefined,
            subject: cfg.subject || undefined,
            fromName: cfg.fromName || undefined,
            fromEmail: cfg.fromEmail || undefined,
            variables: cfg.variables || undefined,
            attachments: cfg.attachments || [],   // [{ filename, path?, content?, contentType? }]
          });

          return result; // { success, sent, logs }
          
        } catch (error) {
          console.log(error)
        }

      }

    // ── SMS ─────────────────────────────────────────────
    case 'sms':
      // Brancher sur Twilio, Vonage…
      console.log(`[sms] Envoi message="${cfg.message}" depuis="${cfg.from}"`);
      return null;

    // ── Notification push ────────────────────────────────
    case 'push':
      console.log(`[push] Titre="${cfg.title}" corps="${cfg.body}"`);
      return null;

    // ── Message interne ──────────────────────────────────
    case 'chat':
      console.log(`[chat] → ${cfg.to} : ${cfg.message}`);
      return null;

    // ── Telegram ─────────────────────────────────────────
    case 'telegram': {
      if (cfg.botToken && cfg.chatId) {
        await fetch(`https://api.telegram.org/bot${cfg.botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: cfg.chatId,
            text: cfg.message || '',
            disable_notification: cfg.silent || false,
          }),
        });
      }
      return null;
    }

    // ── Condition (retourne true/false) ──────────────────
    case 'condition':
    case 'filter':
      return evaluateCondition(cfg, node.context || {});

    // ── Split A/B (logique gérée dans traverseNodes) ─────
    case 'split':
      return null;

    // ── Boucle ────────────────────────────────────────────
    case 'loop': {
      const ctx = node.context || {};

      // ── Résoudre la liste selon la source ───────────────────────────────────
      let list = [];

      if (cfg.source === "variable" || cfg.source === "webhook") {
        const raw = ctx[cfg.variableName];
        let parsed = raw;
        if (typeof raw === "string") {
          try { parsed = JSON.parse(raw); } catch { parsed = []; }
        }
        list = cfg.jsonPath ? resolveJsonPath(parsed, cfg.jsonPath) : parsed;

      } else if (cfg.source === "contacts") {
        const members = await prisma.contactListMember.findMany({
          where:   { listId: cfg.listId },
          include: { contact: true },
        });
        list = members.map(m => m.contact);

      } else if (cfg.source === "tags") {
        const tagged = await prisma.contactTag.findMany({
          where:   { tag: cfg.tag },
          include: { contact: true },
        });
        list = tagged.map(t => t.contact);

      } else if (cfg.source === "static") {
        try { list = JSON.parse(cfg.staticData || "[]"); } catch { list = []; }
      }

      if (!Array.isArray(list)) list = [];

      // ── Condition d'exécution ────────────────────────────────────────────────
      if (cfg.skipIfEmpty !== false && list.length === 0) {
        console.log(`[loop] liste vide → court-circuit`);
        return { iterated: 0, skipped: true };
      }

      const maxIter = cfg.maxIterations > 0 ? cfg.maxIterations : list.length;
      const iterVar = cfg.iteratorVar || "item";
      const indexVar = cfg.indexVar   || "index";
      const delayMs  = (cfg.iterDelay || 0) * ({ second: 1000, minute: 60_000, hour: 3_600_000 }[cfg.iterUnit] || 1000);

      console.log(`[loop] source="${cfg.source}" items=${list.length} max=${maxIter}`);

      // ── Boucle ───────────────────────────────────────────────────────────────
      let iterated = 0;
      for (let i = 0; i < Math.min(list.length, maxIter); i++) {
        const item = list[i];

        // Injecter l'item courant dans le contexte partagé
        ctx[iterVar] = item;
        if (cfg.exposeIndex) ctx[indexVar] = i;

        console.log(`[loop] itération ${i + 1}/${Math.min(list.length, maxIter)}`, item);

        // Délai entre itérations (sauf la première)
        if (i > 0 && delayMs > 0) {
          await new Promise(r => setTimeout(r, delayMs));
        }

        iterated++;
      }

      return { iterated, total: list.length };
    }

    // ── Arrêt ─────────────────────────────────────────────
    case 'stop':
      console.log(`[stop] Raison="${cfg.reason || 'N/A'}"`);
      return null;

    // ── Tag ───────────────────────────────────────────────
    case 'tag':
      console.log(`[tag] action="${cfg.action}" tag="${cfg.tag}"`);
      // Brancher ici sur votre logique de tags contacts
      return null;

    // ── Contacts ──────────────────────────────────────────
    case 'add_contact':
      console.log(`[add_contact] email="${cfg.email}"`);
      return null;

    case 'remove_contact':
      console.log(`[remove_contact] fullDelete=${cfg.fullDelete}`);
      return null;

    case 'update_contact':
      console.log(`[update_contact] champ="${cfg.field}" valeur="${cfg.value}"`);
      return null;

    case 'subscribe':
      console.log(`[subscribe] liste="${cfg.listId}"`);
      return null;

    case 'unsubscribe':
      console.log(`[unsubscribe] liste="${cfg.listId || 'toutes'}" blacklist=${cfg.blacklist}`);
      return null;

    // ── Webhook ───────────────────────────────────────────
    case 'webhook': {
      if (!cfg.url) return null;
      try {
        // ── Headers ────────────────────────────────────────
        const headers = { 'Content-Type': 'application/json' };
        if (cfg.authType === 'bearer' && cfg.token)
          headers['Authorization'] = `Bearer ${cfg.token}`;
        if (cfg.authType === 'apikey' && cfg.apiKeyHeader)
          headers[cfg.apiKeyHeader] = cfg.apiKeyValue || '';
        if (cfg.authType === 'basic' && cfg.basicUser)
          headers['Authorization'] = 'Basic ' +
            Buffer.from(`${cfg.basicUser}:${cfg.basicPass}`).toString('base64');

        // ── Requête ────────────────────────────────────────
        const controller = new AbortController();
        const timer = cfg.waitResponse
          ? setTimeout(() => controller.abort(), Math.max((cfg.timeout || 30), 15) * 1000)
          : null;

        const res = await fetch(cfg.url, {
          method: cfg.method || 'POST',
          headers,
          signal: controller.signal,
          body: ['GET'].includes(cfg.method)
            ? undefined
            : interpolateVariables(cfg.body || '{}', node.context || {}),
        });

        if (timer) clearTimeout(timer);

        // ── Vérifier le code de succès ─────────────────────
        const isSuccess = cfg.successCode === '200' ? res.status === 200
          : cfg.successCode === '201' ? res.status === 201
            : res.status >= 200 && res.status < 300;

        if (!isSuccess && cfg.retry)
          throw new Error(`Webhook HTTP ${res.status}`);

        // ── Lire la réponse si demandé ─────────────────────
        if (!cfg.waitResponse) return null;

        let responseData = null;

        if (cfg.responseFormat === 'json') {
          try {
            responseData = await res.json();
          } catch {
            responseData = null;
          }
        } else {
          responseData = await res.text();
        }

        // Stocker la réponse brute dans le contexte
        if (cfg.responseVariable && node.context) {
          node.context[cfg.responseVariable] = responseData;
        }

        // ── Mapper les champs JSON → variables ─────────────
        if (cfg.responseFormat === 'json' && responseData && cfg.responseMappings?.length) {
          for (const { jsonPath, variable } of cfg.responseMappings) {
            if (!jsonPath || !variable) continue;

            // Résoudre le chemin ex: "data.user.id"
            const value = jsonPath.split('.').reduce((obj, key) => obj?.[key], responseData);

            if (value !== undefined && node.context) {
              node.context[variable] = value;
              console.log(`[webhook] Mapping: ${jsonPath} → ${variable} = ${JSON.stringify(value)}`);
            }
          }
        }

        return responseData;

      } catch (error) {
        console.log(error)
      }
    }

    // ── Base de données ───────────────────────────────────
    case 'database':
      // Brancher ici sur votre logique Prisma/BDD
      console.log(`[database] opération="${cfg.operation}" table="${cfg.table}"`);
      return null;

    // ── Copier champ ──────────────────────────────────────
    case 'copy_field':
      console.log(`[copy_field] ${cfg.source} → ${cfg.destination}`);
      return null;

    // ── Score ─────────────────────────────────────────────
    case 'score':
      console.log(`[score] action="${cfg.action}" valeur=${cfg.value}`);
      return null;

    // ── Note ──────────────────────────────────────────────
    case 'note':
      console.log(`[note] "${cfg.content}"`);
      return null;

    // ── Objectif ──────────────────────────────────────────
    case 'goal':
      console.log(`[goal] nom="${cfg.name}" valeur=${cfg.value}`);
      return null;

    case 'ai_agent': {
      if (!cfg.prompt) return null;

      const provider = cfg.provider || 'anthropic';
      const prompt = interpolateVariables(cfg.prompt, node.context || {});
      const system = cfg.systemPrompt ? interpolateVariables(cfg.systemPrompt, node.context || {}) : null;

      let result = null;

      if (provider === 'anthropic') {
        result = await callAnthropic({
          model: cfg.model || 'claude-sonnet-4-20250514',
          prompt,
          system,
          maxTokens: cfg.maxTokens || 500,
          temperature: cfg.temperature ?? 0.7,
        });
      } else if (provider === 'openai') {
        result = await callOpenAI({
          model: cfg.model || 'gpt-4o',
          prompt,
          system,
          maxTokens: cfg.maxTokens || 500,
          temperature: cfg.temperature ?? 0.7,
        });
      } else if (provider === 'mistral') {
        result = await callMistral({
          model: cfg.model || 'mistral-large-latest',
          prompt,
          system,
          maxTokens: cfg.maxTokens || 500,
          temperature: cfg.temperature ?? 0.7,
        });
      }

      if (cfg.logResponse) {
        console.log(`[ai_agent] provider=${provider} model=${cfg.model} result="${result}"`);
      }

      // Pour la tâche "decide" → retourner true/false pour les branches condition
      if (cfg.task === 'decide') {
        const normalized = (result || '').trim().toLowerCase();
        return normalized.includes('oui') || normalized.includes('yes') || normalized === 'true';
      }

      // Stocker dans node.context pour les nœuds suivants
      if (cfg.outputField && node.context) {
        node.context[cfg.outputField] = result;
      }

      return result;
    }

    default:
      console.warn(`[engine] Type de nœud inconnu : "${node.type}"`);
      return null;
  }
}

/* ════════════════════════════════════════════════════
   HELPER — Évaluation de condition
════════════════════════════════════════════════════ */
function evaluateCondition(cfg, context = {}) {
  const { source, field, operator, value } = cfg;

  let actual;

  if (source === "variable") {
    actual = context[cfg.variableName];

    // ── Parser si c'est une string JSON ──────────────
    if (typeof actual === "string") {
      try { actual = JSON.parse(actual); } catch { /* laisser tel quel */ }
    }

    // ── Naviguer dans l'objet si jsonPath défini ─────
    if (actual !== undefined && cfg.jsonPath) {
      actual = resolveJsonPath(actual, cfg.jsonPath);
    }

  } else {
    const contact = context.contact || {};
    actual = field === "custom_field"
      ? contact[cfg.customFieldKey] ?? null
      : contact[field] ?? null;

  }

  const result = applyOperator(actual, operator, value);
  return result;
}

// Résoudre un chemin JSON : "data.user.id" ou "items[0].name"
function resolveJsonPath(obj, path) {
  try {
    // Convertir "items[0].name" → ["items", "0", "name"]
    const keys = path
      .replace(/\[(\d+)\]/g, '.$1') // items[0] → items.0
      .split('.')
      .filter(Boolean);

    return keys.reduce((cur, key) => cur?.[key], obj);
  } catch {
    return undefined;
  }
}

// Appliquer l'opérateur de comparaison
function applyOperator(actual, operator, expected) {
  switch (operator) {
    case 'eq': return String(actual) === String(expected);
    case 'neq': return String(actual) !== String(expected);
    case 'contains': return String(actual).toLowerCase().includes(String(expected).toLowerCase());
    case 'not_contains': return !String(actual).toLowerCase().includes(String(expected).toLowerCase());
    case 'gt': return Number(actual) > Number(expected);
    case 'lt': return Number(actual) < Number(expected);
    case 'is_empty': return actual === null || actual === undefined || actual === '';
    case 'is_not_empty': return actual !== null && actual !== undefined && actual !== '';
    case 'is_true': return actual === true || actual === 'true' || actual === 1;
    case 'is_false': return actual === false || actual === 'false' || actual === 0;
    default: return true;
  }
}


/* ════════════════════════════════════════════════════
   Fonctions d'appel aux providers — à ajouter en bas
════════════════════════════════════════════════════ */

async function callAnthropic({ model, prompt, system, maxTokens, temperature }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY manquante');

  const body = {
    model,
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: prompt }],
  };
  if (system) body.system = system;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`Anthropic API error: ${res.status}`);
  const data = await res.json();
  return data.content?.[0]?.text || '';
}

async function callOpenAI({ model, prompt, system, maxTokens, temperature }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY manquante');

  const messages = [];
  if (system) messages.push({ role: 'system', content: system });
  messages.push({ role: 'user', content: prompt });

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages, max_tokens: maxTokens, temperature }),
  });

  if (!res.ok) throw new Error(`OpenAI API error: ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

async function callMistral({ model, prompt, system, maxTokens, temperature }) {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) throw new Error('MISTRAL_API_KEY manquante');

  const messages = [];
  if (system) messages.push({ role: 'system', content: system });
  messages.push({ role: 'user', content: prompt });

  const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages, max_tokens: maxTokens, temperature }),
  });

  if (!res.ok) throw new Error(`Mistral API error: ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

// Remplace {{contact.email}} par les vraies valeurs du contexte
function interpolateVariables(text, context) {
  return text.replace(/\{\{([^}]+)\}\}/g, (_, key) => {
    const keys = key.trim().split('.');
    let val = context;
    for (const k of keys) val = val?.[k];
    return val ?? `{{${key}}}`;
  });
}


module.exports = router;