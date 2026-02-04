// =====================================================
// utils/planLimits.js
// =====================================================

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function getPlanLimits(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      plan: true,
      customPlan: true,
    },
  });

  if (!user) throw new Error("Utilisateur non trouvé");

  // Si l'utilisateur a un plan personnalisé approuvé, utiliser celui-ci
  if (user.customPlan && user.customPlan.status === "ACTIVE") {
    return {
      emailsPerMonth: user.customPlan.emailsPerMonth,
      maxBulkSend: user.customPlan.maxBulkSend,
      apiKeysMax: user.plan.apiKeysMax, // On garde les limites du plan de base
      templatesMax: user.plan.templatesMax,
      planName: `${user.plan.displayName} (Personnalisé)`,
      isCustom: true,
    };
  }

  // Sinon, utiliser le plan standard
  return {
    emailsPerMonth: user.plan.emailsPerMonth,
    maxBulkSend: user.plan.maxBulkSend,
    apiKeysMax: user.plan.apiKeysMax,
    templatesMax: user.plan.templatesMax,
    planName: user.plan.displayName,
    isCustom: false,
  };
}

const PLAN_LIMITS = {
  FREE: { emailsPerMonth: 100, apiKeysMax: 2, templatesMax: 5 },
  PRO: { emailsPerMonth: 5000, apiKeysMax: 10, templatesMax: 50 },
  BUSINESS: { emailsPerMonth: 50000, apiKeysMax: 50, templatesMax: 500 },
};


const checkQuota = (user) => {
  const limit = PLAN_LIMITS[user?user.plan : 'FREE'];
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

module.exports = { PLAN_LIMITS, checkQuota, getPlanLimits };