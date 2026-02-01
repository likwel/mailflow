// =====================================================
// utils/planLimits.js
// =====================================================
const PLAN_LIMITS = {
  FREE: { emailsPerMonth: 100, apiKeysMax: 2, templatesMax: 5 },
  PRO: { emailsPerMonth: 5000, apiKeysMax: 10, templatesMax: 50 },
  BUSINESS: { emailsPerMonth: 50000, apiKeysMax: 50, templatesMax: 500 },
};

const checkQuota = (user) => {
  const limit = PLAN_LIMITS[user.plan];
  const now = new Date();

  // Reset mensuel
  const lastReset = new Date(user.emailsReset);
  if (now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()) {
    return { needsReset: true, limit };
  }

  return {
    needsReset: false,
    limit,
    remaining: limit.emailsPerMonth - user.emailsUsed,
    used: user.emailsUsed,
  };
};

module.exports = { PLAN_LIMITS, checkQuota };