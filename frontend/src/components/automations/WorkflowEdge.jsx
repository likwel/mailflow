// src/components/automations/WorkflowEdge.jsx

const NODE_W = 200;
const NODE_H = 80;

export default function WorkflowEdge({ src, tgt, edge }) {
  // Point de départ = bas du nœud source, arrivée = haut du nœud cible
  const x1 = src.x + NODE_W / 2;
  const y1 = src.y + NODE_H + 4;
  const x2 = tgt.x + NODE_W / 2;
  const y2 = tgt.y - 4;

  // Courbe de Bézier cubique
  const dy = Math.abs(y2 - y1) * 0.5;
  const d  = `M ${x1} ${y1} C ${x1} ${y1 + dy}, ${x2} ${y2 - dy}, ${x2} ${y2}`;

  const color = edge.status === "active" ? "#6366f1" : "#cbd5e1";
  const animated = edge.status === "active";

  return (
    <g>
      {/* Chemin de fond (plus épais, transparent) */}
      <path d={d} fill="none" stroke="transparent" strokeWidth={12}/>

      {/* Chemin visible */}
      <path
        d={d} fill="none"
        stroke={color} strokeWidth={2}
        strokeDasharray={animated ? "6 4" : "none"}
        style={animated ? { animation: "dashMove 0.8s linear infinite" } : {}}
      />

      {/* Flèche */}
      <polygon
        points={`${x2},${y2} ${x2-5},${y2-8} ${x2+5},${y2-8}`}
        fill={color}
      />

      <style>{`
        @keyframes dashMove {
          from { stroke-dashoffset: 0; }
          to   { stroke-dashoffset: -20; }
        }
      `}</style>
    </g>
  );
}