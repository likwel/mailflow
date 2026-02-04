// =====================================================
// src/hooks/useApi.js — Wrappers pour tous les appels backend
// =====================================================
import client from "../api/client";

// ─── Stats & Logs ─────────────────────────────────────
export async function fetchStats() {
  const res = await client.get("/dashboard/stats");
  return res.data;
}

export async function fetchLogs(page = 1, limit = 20, status = null) {
  const params = { page, limit };
  if (status) params.status = status;
  const res = await client.get("/dashboard/logs", { params });
  return res.data;
}

// ─── API Keys ─────────────────────────────────────────
export async function fetchApiKeys() {
  const res = await client.get("/dashboard/apikeys");
  return res.data;
}

export async function createApiKey(name) {
  const res = await client.post("/dashboard/apikeys", { name });
  return res.data;
}

export async function updateApiKey(id, data) {
  const res = await client.put(`/dashboard/apikeys/${id}`, data);
  return res.data;
}

export async function deleteApiKey(id) {
  const res = await client.delete(`/dashboard/apikeys/${id}`);
  return res.data;
}

// ─── Templates ────────────────────────────────────────
export async function fetchTemplates() {
  const res = await client.get("/dashboard/templates");
  return res.data;
}

export async function createTemplate(data) {
  const res = await client.post("/dashboard/templates", data);
  return res.data;
}

export async function updateTemplate(id, data) {
  const res = await client.put(`/dashboard/templates/${id}`, data);
  return res.data;
}

export async function deleteTemplate(id) {
  const res = await client.delete(`/dashboard/templates/${id}`);
  return res.data;
}

// ─── Bulk Send ────────────────────────────────────────
export async function sendBulk({ recipients, subject, html, text, templateId }) {
  const res = await client.post("/dashboard/send-bulk", {
    recipients,
    subject,
    html,
    text,
    templateId,
  });
  return res.data;
}
