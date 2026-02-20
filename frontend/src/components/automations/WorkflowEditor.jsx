// src/components/automations/WorkflowEditor.jsx
import { useState, useCallback, useRef, useEffect } from "react";
import ReactFlow, {
  addEdge, Background, Controls, MiniMap,
  useNodesState, useEdgesState, Panel,
} from "reactflow";
import "reactflow/dist/style.css";

import CustomNode      from "./CustomNode";
import NodePalette     from "./NodePalette";
import WorkflowToolbar from "./WorkflowToolbar";
import NodeConfigPanel from "./NodeConfigPanel";
import client          from "../../api/client";
import useWorkflowStatus from "../../hooks/useWorkflowStatus";

const nodeTypes = { custom: CustomNode };

const EDGE_STYLE = {
  type: "smoothstep",
  animated: false,
  style: { stroke: "#9ca3af", strokeWidth: 2 },
};

const NODE_DEFAULTS = {
  // ── Déclencheurs ──────────────────────────────────────────────────────────
  trigger:        { label: "Déclencheur",      config: { event: "contact.created", runMode: "once", active: true } },
  schedule:       { label: "Planificateur",    config: { freq: "daily", time: "09:00", tz: "Europe/Paris" } },
  alarm:          { label: "Rappel",           config: { duration: 1, unit: "day", repeat: false } },

  // ── Timing ────────────────────────────────────────────────────────────────
  delay:          { label: "Attendre",         config: { delayType: "duration", duration: 1, unit: "day", skipWeekends: false } },

  // ── Communication ─────────────────────────────────────────────────────────
  email:          { label: "Envoyer email",    config: { trackOpens: true, trackClicks: true, unsubLink: true, sendTime: "immediate" } },
  sms:            { label: "Envoyer SMS",      config: { checkOptin: true } },
  push:           { label: "Notification",     config: { icon: "default", badge: true } },
  chat:           { label: "Message interne",  config: { to: "owner" } },
  telegram:       { label: "Telegram",         config: { silent: false } },

  // ── Logique ───────────────────────────────────────────────────────────────
  condition:      { label: "Condition",        config: { logic: "all", operator: "eq" } },
  filter:         { label: "Filtre",           config: { operator: "eq" } },
  split:          { label: "Split A/B",        config: { splitA: 50 } },
  loop:           { label: "Boucle",           config: { source: "contacts", iterDelay: 0, iterUnit: "second" } },
  stop:           { label: "Arrêt",            config: { markConverted: false } },

  // ── Contact ───────────────────────────────────────────────────────────────
  tag:            { label: "Ajouter tag",      config: { action: "add", notifyDuplicate: false } },
  add_contact:    { label: "Ajouter contact",  config: { upsert: true } },
  remove_contact: { label: "Suppr. contact",   config: { fullDelete: false } },
  update_contact: { label: "Màj contact",      config: { field: "" } },
  subscribe:      { label: "Abonner",          config: { sendConfirm: false } },
  unsubscribe:    { label: "Désabonner",       config: { blacklist: false } },

  // ── Données ───────────────────────────────────────────────────────────────
  webhook:        { label: "Webhook",          config: { method: "POST", retry: true, authType: "none", waitResponse: false } },
  database:       { label: "Base de données",  config: { operation: "read" } },
  copy_field:     { label: "Copier champ",     config: { overwrite: true } },
  score:          { label: "Score",            config: { action: "add", value: 10, notifyThreshold: false } },
  note:           { label: "Note",             config: { includeDate: true } },

  // ── Reporting ─────────────────────────────────────────────────────────────
  goal:           { label: "Objectif",         config: { value: 0, exitAfter: true } },
  ai_agent: {
    label: "Agent IA",
    config: {
      provider:    "anthropic",
      model:       "claude-sonnet-4-20250514",
      task:        "generate",
      prompt:      "",
      outputField: "ai_result",
      maxTokens:   500,
      temperature: 0.7,
    },
  },

};

const NODE_MAP_COLOR = {
  trigger: "#f59e0b", delay: "#6366f1", email: "#0891b2",
  condition: "#10b981", tag: "#8b5cf6", webhook: "#ef4444",
};

/* ─── Conversions DB ↔ React Flow ─────────────────────── */
function toRFNodes(nodes, handlers) {
  return (nodes || []).map(n => ({
    id: n.id,
    type: "custom",
    position: { x: n.x || 100, y: n.y || 200 },
    data: {
      ...n,
      onDelete:       () => handlers.onDelete(n.id),
      onConfigChange: (cfg) => handlers.onConfigChange(n.id, cfg),
      onSelect:       () => handlers.onSelect(n.id),
      onAddNext:      () => handlers.onAddNext(n.id),
    },
  }));
}

function toRFEdges(edges) {
  return (edges || []).map(e => ({ ...e, ...EDGE_STYLE }));
}

/* ─── Composant principal ──────────────────────────────── */
export default function WorkflowEditor({ workflow: initial, onClose, onSaved }) {
  const [workflow,     setWorkflow]     = useState(initial);
  const [saving,       setSaving]       = useState(false);
  const [showPalette,  setShowPalette]  = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [executionId,  setExecutionId]  = useState(null);
  const [running,      setRunning]      = useState(false);

  const reactFlowWrapper = useRef(null);
  const [rfInstance, setRfInstance] = useState(null);

  /* ── Handlers node (stables, sans dépendances circulaires) ── */
  const handleDelete = useCallback(id => {
    setNodes(ns => ns.filter(n => n.id !== id));
    setSelectedNode(s => s === id ? null : s);
  }, []);

  const handleConfigChange = useCallback((id, cfg) => {
    setNodes(ns => ns.map(n => {
      if (n.id !== id) return n;
      const label  = cfg.__label !== undefined ? cfg.__label : n.data.label;
      const config = Object.fromEntries(Object.entries(cfg).filter(([k]) => k !== "__label"));
      return { ...n, data: { ...n.data, label, config } };
    }));
  }, []);

  const handleSelect = useCallback(id => setSelectedNode(id), []);

  const handleAddNext = useCallback(sourceId => {
    setNodes(prev => {
      const source = prev.find(n => n.id === sourceId);
      if (!source) return prev;
      const newId   = `node_${Date.now()}`;
      const newType = "email";
      const def     = NODE_DEFAULTS[newType];
      const newNode = {
        id: newId, type: "custom",
        position: { x: source.position.x + 220, y: source.position.y },
        data: {
          id: newId, type: newType,
          label:  def.label,
          config: { ...def.config },
          status: "idle",
          onDelete:       () => handleDelete(newId),
          onConfigChange: (cfg) => handleConfigChange(newId, cfg),
          onSelect:       () => handleSelect(newId),
          onAddNext:      () => handleAddNext(newId),
        },
      };
      setEdges(es => [...es, {
        id: `e_${sourceId}_${newId}`,
        source: sourceId, target: newId,
        ...EDGE_STYLE,
      }]);
      return [...prev, newNode];
    });
  }, [handleDelete, handleConfigChange, handleSelect]);

  /* ── Construire les handlers stables en objet ── */
  const handlers = {
    onDelete: handleDelete,
    onConfigChange: handleConfigChange,
    onSelect: handleSelect,
    onAddNext: handleAddNext,
  };

  /* ── État React Flow ── */
  const [nodes, setNodes, onNodesChange] = useNodesState(
    toRFNodes(initial?.nodes || [], handlers)
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    toRFEdges(initial?.edges || [])
  );

  const onConnect = useCallback(params => {
    setEdges(es => addEdge({ ...params, ...EDGE_STYLE }, es));
  }, []);

  /* ── Polling statuts exécution ── */
  const { nodeStatuses, execStatus } = useWorkflowStatus(workflow?.id, executionId);

  useEffect(() => {
    if (["success", "error"].includes(execStatus)) setRunning(false);
  }, [execStatus]);

  useEffect(() => {
    if (!nodeStatuses || !Object.keys(nodeStatuses).length) return;
    setNodes(prev => prev.map(n => ({
      ...n,
      data: { ...n.data, status: nodeStatuses[n.id] || "idle" },
    })));
  }, [nodeStatuses]);

  /* ── Ajouter un nœud depuis la palette ── */
  function addNode(type) {
    const id  = `node_${Date.now()}`;
    const def = NODE_DEFAULTS[type] || { label: type, config: {} };
    const pos = rfInstance?.project({
      x: reactFlowWrapper.current?.clientWidth  / 2 || 300,
      y: reactFlowWrapper.current?.clientHeight / 2 || 200,
    }) || { x: 300, y: 200 };

    const newNode = {
      id, type: "custom",
      position: pos,
      data: {
        id, type,
        label:  def.label,
        config: { ...def.config },
        status: "idle",
        onDelete:       () => handleDelete(id),
        onConfigChange: (cfg) => handleConfigChange(id, cfg),
        onSelect:       () => handleSelect(id),
        onAddNext:      () => handleAddNext(id),
      },
    };
    setNodes(ns => [...ns, newNode]);
    setShowPalette(false);
  }

  /* ── Sauvegarder ── */
  async function handleSave() {
    setSaving(true);
    try {
      const dbNodes = nodes.map(n => ({
        id:     n.id,
        type:   n.data.type,
        label:  n.data.label,
        config: n.data.config || {},
        x:      Math.round(n.position.x),
        y:      Math.round(n.position.y),
      }));
      const dbEdges = edges.map(e => ({
        id: e.id, source: e.source, target: e.target,
        sourceHandle: e.sourceHandle || null,
        targetHandle: e.targetHandle || null,
      }));
      const payload = { ...workflow, nodes: dbNodes, edges: dbEdges };
      if (workflow?.id) {
        await client.put(`/automations/workflows/${workflow.id}`, payload);
      } else {
        const res = await client.post("/automations/workflows", payload);
        setWorkflow(res.data);
      }
      onSaved?.();
    } catch {
      alert("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  }

  /* ── Toggle actif/inactif ── */
  async function handleToggle() {
    const newStatus = workflow?.status === "active" ? "inactive" : "active";
    setWorkflow(w => ({ ...w, status: newStatus }));
    if (workflow?.id) {
      await client.patch(`/automations/workflows/${workflow.id}/status`, { status: newStatus });
    }
  }

  /* ── Supprimer le workflow ── */
  async function handleDeleteWorkflow() {
    if (!confirm("Supprimer ce workflow ?")) return;
    if (workflow?.id) await client.delete(`/automations/workflows/${workflow.id}`);
    onClose?.();
  }

  /* ── Lancer l'exécution ── */
  async function handleRun() {
    if (!workflow?.id)               return alert("Sauvegardez d'abord le workflow");
    if (workflow?.status !== "active") return alert("Activez d'abord le workflow");
    try {
      setRunning(true);
      setNodes(prev => prev.map(n => ({ ...n, data: { ...n.data, status: "idle" } })));
      const res = await client.post(`/automations/workflows/${workflow.id}/run`);
      setExecutionId(res.data.executionId);
    } catch {
      alert("Erreur lors du lancement");
      setRunning(false);
    }
  }

  /* ── Badge exécution ── */
  const execBadge = {
    idle:    null,
    running: { bg: "#eff6ff", color: "#6366f1", label: "En cours…" },
    success: { bg: "#f0fdf4", color: "#10b981", label: "Succès ✓"  },
    error:   { bg: "#fff1f2", color: "#ef4444", label: "Erreur"    },
  }[execStatus] ?? null;

  /* ── Node sélectionné (objet RF) ── */
  const selectedNodeObj = nodes.find(n => n.id === selectedNode) ?? null;

  /* ─────────────────────────────── RENDER ─────────────────────────────── */
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", flexDirection: "column", background: "#f0f2f5" }}>

      <WorkflowToolbar
        workflow={workflow}
        saving={saving}
        onSave={handleSave}
        onToggle={handleToggle}
        onDelete={handleDeleteWorkflow}
        onClose={onClose}
        onReset={() => { setNodes([]); setEdges([]); }}
        onRun={handleRun}
        running={running}
        execBadge={execBadge}
      />

      <div ref={reactFlowWrapper} style={{ flex: 1, position: "relative" }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={setRfInstance}
          onPaneClick={() => setSelectedNode(null)}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.6, minZoom: 0.4, maxZoom: 1 }}
          deleteKeyCode="Delete"
          snapToGrid
          snapGrid={[16, 16]}
          defaultEdgeOptions={EDGE_STYLE}
        >
          <Background variant="dots" gap={20} size={1} color="#c8cdd5"/>
          <Controls/>
          <MiniMap
            nodeColor={n => NODE_MAP_COLOR[n.data?.type] || "#e2e8f0"}
            style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8 }}
          />

          <Panel position="top-right">
            <button
              onClick={() => setShowPalette(o => !o)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 16px", borderRadius: 8,
                background: "#6366f1", color: "#fff",
                border: "none", cursor: "pointer",
                fontSize: 13, fontWeight: 700,
                boxShadow: "0 4px 14px rgba(99,102,241,.4)",
              }}
            >
              + Ajouter un nœud
            </button>

            {showPalette && (
              <NodePalette
                onSelect={addNode}
                onClose={() => setShowPalette(false)}
              />
            )}
          </Panel>
        </ReactFlow>
      </div>

      {selectedNodeObj && (
        <NodeConfigPanel
          node={selectedNodeObj}
          onClose={() => setSelectedNode(null)}
          onChange={(cfg) => handleConfigChange(selectedNode, cfg)}
          onDelete={() => handleDelete(selectedNode)}
        />
      )}
    </div>
  );
}