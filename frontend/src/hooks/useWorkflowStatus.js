
// ─── src/hooks/useWorkflowStatus.js ──────────────────
import { useState, useEffect, useRef } from "react";
import client from "../api/client";

export default function useWorkflowStatus(workflowId, executionId) {
  const [nodeStatuses, setNodeStatuses] = useState({});
  const [execStatus,   setExecStatus]   = useState("idle");
  const timer = useRef(null);

  useEffect(() => {
    if (!workflowId || !executionId) return;

    timer.current = setInterval(async () => {
      try {
        const res = await client.get(
          `/automations/workflows/${workflowId}/executions/${executionId}`
        );
        setNodeStatuses(res.data.nodeStatuses || {});
        setExecStatus(res.data.status);

        if (["success", "error"].includes(res.data.status)) {
          clearInterval(timer.current);
        }
      } catch (e) {
        clearInterval(timer.current);
      }
    }, 1500);

    return () => clearInterval(timer.current);
  }, [workflowId, executionId]);

  return { nodeStatuses, execStatus };
}
