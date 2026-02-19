// src/components/automations/WorkflowCanvas.jsx
import { useState, useRef, useCallback } from "react";
import WorkflowNode from "./WorkflowNode";
import WorkflowEdge from "./WorkflowEdge";
import NodePalette from "./NodePalette";
import { Plus } from "lucide-react";

const GRID_SIZE = 20;

export default function WorkflowCanvas({ workflow, onChange }) {
  const [nodes, setNodes]         = useState(workflow?.nodes || []);
  const [edges, setEdges]         = useState(workflow?.edges || []);
  const [selected, setSelected]   = useState(null);
  const [dragging, setDragging]   = useState(null);
  const [showPalette, setShowPalette] = useState(false);
  const [palettePos, setPalettePos]  = useState({ x: 0, y: 0 });
  const canvasRef = useRef(null);
  const dragOffset = useRef({ x: 0, y: 0 });

  const snap = v => Math.round(v / GRID_SIZE) * GRID_SIZE;

  // ── Ajouter un nœud depuis la palette ──────────────
  function addNode(type, canvasX, canvasY) {
    const id = `node_${Date.now()}`;
    const newNode = {
      id,
      type,
      x: snap(canvasX - 90),
      y: snap(canvasY - 40),
      label: NODE_DEFAULTS[type]?.label || type,
      config: NODE_DEFAULTS[type]?.config || {},
      status: "idle",
    };
    const updated = [...nodes, newNode];
    setNodes(updated);
    onChange?.({ ...workflow, nodes: updated, edges });
    setShowPalette(false);
  }

  // ── Drag nœud ───────────────────────────────────────
  function onNodeMouseDown(e, id) {
    e.stopPropagation();
    setSelected(id);
    const node = nodes.find(n => n.id === id);
    dragOffset.current = { x: e.clientX - node.x, y: e.clientY - node.y };
    setDragging(id);
  }

  function onCanvasMouseMove(e) {
    if (!dragging) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = snap(e.clientX - rect.left - dragOffset.current.x + canvasRef.current.scrollLeft);
    const y = snap(e.clientY - rect.top  - dragOffset.current.y + canvasRef.current.scrollTop);
    setNodes(prev => prev.map(n => n.id === dragging ? { ...n, x, y } : n));
  }

  function onCanvasMouseUp() {
    if (dragging) {
      onChange?.({ ...workflow, nodes, edges });
    }
    setDragging(null);
  }

  // ── Clic droit sur canvas = palette ────────────────
  function onCanvasContextMenu(e) {
    e.preventDefault();
    const rect = canvasRef.current.getBoundingClientRect();
    setPalettePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setShowPalette(true);
  }

  // ── Supprimer nœud ──────────────────────────────────
  function deleteNode(id) {
    const updNodes = nodes.filter(n => n.id !== id);
    const updEdges = edges.filter(e => e.source !== id && e.target !== id);
    setNodes(updNodes);
    setEdges(updEdges);
    setSelected(null);
    onChange?.({ ...workflow, nodes: updNodes, edges: updEdges });
  }

  // ── Mettre à jour config nœud ───────────────────────
  function updateNode(id, patch) {
    const updated = nodes.map(n => n.id === id ? { ...n, ...patch } : n);
    setNodes(updated);
    onChange?.({ ...workflow, nodes: updated, edges });
  }

  return (
    <div style={{ position: "relative", flex: 1, overflow: "hidden", background: "#f0f2f5" }}>

      {/* Grille de fond style n8n */}
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
        <defs>
          <pattern id="grid" width={GRID_SIZE} height={GRID_SIZE} patternUnits="userSpaceOnUse">
            <circle cx={1} cy={1} r={0.8} fill="#c8cdd5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)"/>
      </svg>

      {/* Canvas scrollable */}
      <div
        ref={canvasRef}
        onMouseMove={onCanvasMouseMove}
        onMouseUp={onCanvasMouseUp}
        onContextMenu={onCanvasContextMenu}
        onClick={() => { setSelected(null); setShowPalette(false); }}
        style={{ position: "absolute", inset: 0, overflow: "auto", cursor: dragging ? "grabbing" : "default" }}>

        <div style={{ position: "relative", width: 2000, height: 1400 }}>

          {/* SVG des connexions */}
          <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
            {edges.map(edge => {
              const src = nodes.find(n => n.id === edge.source);
              const tgt = nodes.find(n => n.id === edge.target);
              if (!src || !tgt) return null;
              return <WorkflowEdge key={edge.id} src={src} tgt={tgt} edge={edge}/>;
            })}
          </svg>

          {/* Nœuds */}
          {nodes.map(node => (
            <WorkflowNode
              key={node.id}
              node={node}
              selected={selected === node.id}
              onMouseDown={e => onNodeMouseDown(e, node.id)}
              onDelete={() => deleteNode(node.id)}
              onChange={patch => updateNode(node.id, patch)}
            />
          ))}

          {/* Empty state */}
          {nodes.length === 0 && (
            <div style={{
              position: "absolute", top: "50%", left: "50%",
              transform: "translate(-50%,-50%)",
              textAlign: "center", pointerEvents: "none",
            }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>⚡</div>
              <p style={{ fontWeight: 700, fontSize: 18, color: "#64748b", margin: "0 0 6px" }}>
                Canvas vide
              </p>
              <p style={{ fontSize: 13, color: "#94a3b8" }}>
                Clic droit pour ajouter un nœud
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Bouton + flottant */}
      <button
        onClick={e => {
          e.stopPropagation();
          setPalettePos({ x: 20, y: 20 });
          setShowPalette(o => !o);
        }}
        style={{
          position: "absolute", bottom: 24, right: 24,
          width: 48, height: 48, borderRadius: "50%",
          background: "#6366f1", color: "#fff",
          border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 16px rgba(99,102,241,.4)",
          transition: "all .2s",
          zIndex: 10,
        }}
        title="Ajouter un nœud">
        <Plus size={22}/>
      </button>

      {/* Palette contextuelle */}
      {showPalette && (
        <NodePalette
          x={palettePos.x} y={palettePos.y}
          onSelect={type => addNode(type, palettePos.x, palettePos.y)}
          onClose={() => setShowPalette(false)}
        />
      )}
    </div>
  );
}

export const NODE_DEFAULTS = {
  trigger:   { label: "Déclencheur",    config: { event: "contact.created" } },
  delay:     { label: "Délai",          config: { duration: 1, unit: "day" } },
  email:     { label: "Envoyer email",  config: { subject: "", templateId: null } },
  condition: { label: "Condition",      config: { field: "", operator: "eq", value: "" } },
  tag:       { label: "Ajouter tag",    config: { tag: "" } },
  webhook:   { label: "Webhook",        config: { url: "" } },
};