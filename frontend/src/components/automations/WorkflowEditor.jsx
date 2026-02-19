// src/components/automations/WorkflowEditor.jsx
import { useState, useCallback, useRef, useEffect } from "react";
import ReactFlow, {
  addEdge, Background, Controls, MiniMap,
  useNodesState, useEdgesState,
  MarkerType, Panel,
} from "reactflow";
import "reactflow/dist/style.css";

import CustomNode   from "./CustomNode";
import NodePalette  from "./NodePalette";
import WorkflowToolbar from "./WorkflowToolbar";
import client from "../../api/client";
import useWorkflowStatus from "../../hooks/useWorkflowStatus";
import { Play, Loader } from "lucide-react";

const nodeTypes = { custom: CustomNode };

const EDGE_STYLE = {
  type: "smoothstep",
  animated: false,
  style: { stroke: "#6366f1", strokeWidth: 2 },
  markerEnd: { type: MarkerType.ArrowClosed, color: "#6366f1" },
};

// Convertir nodes DB → React Flow
function toRFNodes(nodes, onDelete, onConfigChange) {
  return (nodes || []).map(n => ({
    id: n.id,
    type: "custom",
    position: { x: n.x || 100, y: n.y || 100 },
    data: {
      ...n,
      onDelete:       () => onDelete(n.id),
      onConfigChange: (cfg) => onConfigChange(n.id, cfg),
    },
  }));
}

// Convertir edges DB → React Flow
function toRFEdges(edges) {
  return (edges || []).map(e => ({ ...e, ...EDGE_STYLE }));
}

export default function WorkflowEditor({ workflow: initial, onClose, onSaved }) {
  const [workflow, setWorkflow] = useState(initial);
  const [saving, setSaving]     = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  const reactFlowWrapper = useRef(null);
  const [rfInstance, setRfInstance] = useState(null);

  const [executionId, setExecutionId] = useState(null);
  const [running, setRunning]         = useState(false);

  // ── Helpers pour delete/config (définis avant toRFNodes) ──
  const deleteNode     = useCallback(id => setNodes(ns => ns.filter(n => n.id !== id)), []);
  const updateNodeCfg  = useCallback((id, cfg) => {
    setNodes(ns => ns.map(n => n.id === id ? { ...n, data: { ...n.data, config: cfg } } : n));
  }, []);

  const [nodes, setNodes, onNodesChange] = useNodesState(
    toRFNodes(initial?.nodes || [], deleteNode, updateNodeCfg)
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    toRFEdges(initial?.edges || [])
  );

  // ── Connexion entre nœuds ───────────────────────────
  const onConnect = useCallback(params => {
    setEdges(es => addEdge({ ...params, ...EDGE_STYLE, animated: true }, es));
  }, []);


  // ── Hook polling ──────────────────────────────────
  const { nodeStatuses, execStatus } = useWorkflowStatus(
    workflow?.id,
    executionId
  );

  // Quand execStatus change → arrêter le spinner
  useEffect(() => {
    if (["success", "error"].includes(execStatus)) {
      setRunning(false);
    }
  }, [execStatus]);

  // ── Mettre à jour les nœuds React Flow avec les statuts ──
  useEffect(() => {
    if (!nodeStatuses || Object.keys(nodeStatuses).length === 0) return;
    setNodes(prev => prev.map(n => ({
      ...n,
      data: {
        ...n.data,
        status: nodeStatuses[n.id] || "idle",
      },
    })));
  }, [nodeStatuses]);

  // ── Lancer le workflow ─────────────────────────────
  async function handleRun() {
    if (!workflow?.id) {
      alert("Sauvegardez d'abord le workflow");
      return;
    }
    if (workflow?.status !== "active") {
      alert("Activez d'abord le workflow");
      return;
    }
    try {
      setRunning(true);
      // Reset statuts des nœuds
      setNodes(prev => prev.map(n => ({ ...n, data: { ...n.data, status: "idle" } })));
      const res = await client.post(`/automations/workflows/${workflow.id}/run`);
      setExecutionId(res.data.executionId); // déclenche le polling
    } catch (e) {
      alert("Erreur lors du lancement");
      setRunning(false);
    }
  }

  // ── Indicateur global dans la toolbar ─────────────
  const execBadge = {
    idle:    null,
    running: { bg: "#eff6ff", color: "#6366f1", label: "En cours..."  },
    success: { bg: "#f0fdf4", color: "#10b981", label: "Succès ✓"     },
    error:   { bg: "#fff1f2", color: "#ef4444", label: "Erreur"        },
  }[execStatus];


  // ── Ajouter un nœud depuis la palette ───────────────
  function addNode(type) {
    const id = `node_${Date.now()}`;
    const center = rfInstance?.project({ x: 300, y: 200 }) || { x: 200, y: 200 };
    const newNode = {
      id,
      type: "custom",
      position: center,
      data: {
        id, type,
        label:  LABELS[type] || type,
        status: "idle",
        config: {},
        onDelete:       () => deleteNode(id),
        onConfigChange: (cfg) => updateNodeCfg(id, cfg),
      },
    };
    setNodes(ns => [...ns, newNode]);
    setShowPalette(false);
  }

  // ── Sauvegarder ─────────────────────────────────────
  async function handleSave() {
    setSaving(true);
    try {
      // Convertir RF nodes → format DB
      const dbNodes = nodes.map(n => ({
        id:     n.id,
        type:   n.data.type,
        label:  n.data.label,
        config: n.data.config || {},
        x:      Math.round(n.position.x),
        y:      Math.round(n.position.y),
      }));
      const dbEdges = edges.map(e => ({
        id:     e.id,
        source: e.source,
        target: e.target,
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
    } catch (e) {
      alert("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  }

  // ── Toggle actif/inactif ────────────────────────────
  async function handleToggle() {
    const newStatus = workflow?.status === "active" ? "inactive" : "active";
    setWorkflow(w => ({ ...w, status: newStatus }));
    if (workflow?.id) {
      await client.patch(`/automations/workflows/${workflow.id}/status`, { status: newStatus });
    }
  }

  // ── Supprimer ───────────────────────────────────────
  async function handleDelete() {
    if (!confirm("Supprimer ce workflow ?")) return;
    if (workflow?.id) await client.delete(`/automations/workflows/${workflow.id}`);
    onClose?.();
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", flexDirection: "column", background: "#f0f2f5" }}>

      {/* Toolbar */}
      <WorkflowToolbar
        workflow={workflow}
        saving={saving}
        onSave={handleSave}
        onToggle={handleToggle}
        onDelete={handleDelete}
        onClose={onClose}
        onReset={() => { setNodes([]); setEdges([]); }}
        // ↓ Nouveaux props
        onRun={handleRun}
        running={running}
        execBadge={execBadge}
      />

      {/* Canvas React Flow */}
      <div ref={reactFlowWrapper} style={{ flex: 1 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={setRfInstance}
          nodeTypes={nodeTypes}
          fitView
          deleteKeyCode="Delete"
          snapToGrid snapGrid={[16, 16]}
          defaultEdgeOptions={EDGE_STYLE}
        >
          <Background variant="dots" gap={20} size={1} color="#c8cdd5"/>
          <Controls/>
          <MiniMap
            nodeColor={n => NODE_CONFIG_COLOR[n.data?.type] || "#e2e8f0"}
            style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8 }}
          />

          {/* Bouton + palette */}
          <Panel position="top-right" style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setShowPalette(o => !o)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 16px", borderRadius: 8,
                background: "#6366f1", color: "#fff",
                border: "none", cursor: "pointer",
                fontSize: 13, fontWeight: 700,
                boxShadow: "0 4px 14px rgba(99,102,241,.4)",
                right:0,
              }}>
              + Ajouter un nœud
            </button>

            {showPalette && (
              <NodePalette
                x={0} y={50}
                onSelect={addNode}
                onClose={() => setShowPalette(false)}
              />
            )}
          </Panel>
        </ReactFlow>
      </div>
    </div>
  );
}

const LABELS = {
  trigger: "Déclencheur", delay: "Délai", email: "Envoyer email",
  condition: "Condition", tag: "Ajouter tag", webhook: "Webhook",
};
const NODE_CONFIG_COLOR = {
  trigger: "#f59e0b", delay: "#6366f1", email: "#0891b2",
  condition: "#10b981", tag: "#8b5cf6", webhook: "#ef4444",
};