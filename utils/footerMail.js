const appendFooter = (html, quota) => {
  if (quota.limit.planName !== "Gratuit") return html; // seulement free

  const footer = `
    <div style="margin-top:40px;padding-top:15px;;padding-bottom:15px;border-radius:0.5rem;border:1px solid #eee;text-align:center;font-size:12px;color:#8a8a8a;font-family:Arial; background:#f5f5f5;">
      Courriel envoyé via <strong style="color:#4f46e5"><a href="https://mailflow.dev" style="color:#4f46e5;text-decoration:none">MailFlow</a></strong>
    </div>
  `;

  return html + footer;
}

module.exports = { appendFooter };