// =====================================================
// src/components/Badge.jsx
// =====================================================
import { T } from "../theme";

const statusMap = {
  SENT:    { color: T.success,  bg: T.successLight },
  FAILED:  { color: T.danger,   bg: T.dangerLight },
  BOUNCED: { color: T.warning,  bg: T.warningLight },
  PENDING: { color: T.primary,  bg: T.primaryLight },
};

export default function Badge({ status }) {
  const { color, bg } = statusMap[status] || statusMap.PENDING;
  return (
    <span style={{
      background: bg,
      color,
      fontSize: 11,
      fontWeight: 600,
      padding: "3px 10px",
      borderRadius: 20,
      textTransform: "uppercase",
      display: "inline-block",
    }}>
      {status}
    </span>
  );
}