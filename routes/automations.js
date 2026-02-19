const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// ── GET tous les workflows ──────────────────────────
router.get('/workflows', authMiddleware, async (req, res) => {
  try {
    const workflows = await prisma.workflow.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        executions: {
          orderBy: { startedAt: 'desc' },
          take: 1,
        },
        _count: { select: { executions: true } },
      },
    });

    const enriched = workflows.map(w => ({
      ...w,
      lastExecution: w.executions[0] || null,
      totalRuns:     w._count.executions,
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
      include: {
        executions: { orderBy: { startedAt: 'desc' }, take: 5 },
      },
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
        userId:      req.user.id,
        name:        name.trim(),
        description: description?.trim() || null,
        template:    template  || 'blank',
        trigger:     trigger   || {},
        actions:     actions   || [],
        nodes:       nodes     || [],
        edges:       edges     || [],
        status:      'draft',
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
        ...(name        !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(trigger     !== undefined && { trigger }),
        ...(actions     !== undefined && { actions }),
        ...(nodes       !== undefined && { nodes }),
        ...(edges       !== undefined && { edges }),
        ...(status      !== undefined && { status }),
      },
    });

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

    res.json(workflow);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update status: ' + error.message });
  }
});

// ── DELETE ──────────────────────────────────────────
router.delete('/workflows/:id', authMiddleware, async (req, res) => {
  try {
    // Les executions sont supprimées en cascade (onDelete: Cascade)
    await prisma.workflow.delete({
      where: { id: req.params.id, userId: req.user.id },
    });
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
      return res.status(400).json({ error: 'Le workflow doit être actif pour être exécuté' });

    const execution = await prisma.workflowExecution.create({
      data: {
        workflowId:   workflow.id,
        status:       'running',
        nodeStatuses: {},
      },
    });

    // Exécution asynchrone en arrière-plan
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

// ── Engine exécution nœuds ──────────────────────────
async function runWorkflow(workflow, executionId) {
  const nodes = workflow.nodes || [];
  const nodeStatuses = {};

  try {
    for (const node of nodes) {
      nodeStatuses[node.id] = 'running';
      await prisma.workflowExecution.update({
        where: { id: executionId },
        data:  { nodeStatuses },
      });

      await executeNode(node);

      nodeStatuses[node.id] = 'success';
      await prisma.workflowExecution.update({
        where: { id: executionId },
        data:  { nodeStatuses },
      });
    }

    await prisma.workflowExecution.update({
      where: { id: executionId },
      data:  { status: 'success', finishedAt: new Date(), nodeStatuses },
    });

  } catch (err) {
    await prisma.workflowExecution.update({
      where: { id: executionId },
      data:  { status: 'error', finishedAt: new Date(), nodeStatuses, error: err.message },
    });
  }
}

async function executeNode(node) {
  switch (node.type) {
    case 'delay':
      const units = { minute: 60000, hour: 3600000, day: 86400000 };
      const ms    = (node.config?.duration || 1) * (units[node.config?.unit] || 86400000);
      await new Promise(r => setTimeout(r, Math.min(ms, 5000))); // max 5s en dev
      break;

    case 'webhook':
      if (node.config?.url) {
        await fetch(node.config.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nodeId: node.id, label: node.label }),
        });
      }
      break;

    case 'email':
      // Brancher sur votre logique d'envoi existante
      break;

    default:
      break;
  }
}

module.exports = router;