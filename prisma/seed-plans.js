const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const DEFAULT_PLANS = [
  {
    name:           "FREE",
    displayName:    "Gratuit",
    price:          0,
    priceAnnual:    0,
    emailsPerMonth: 100,
    maxBulkSend:    1,        // pas d'envoi en masse
    apiKeysMax:     1,
    templatesMax:   3,
    contactsMax:    200,
    listsMax:       2,
    workflowsMax:   0,        // pas d'automatisation
    logRetentionDays: 7,
    webhooks:       false,
    features: [
      "100 emails/mois",
      "1 clé API",
      "3 templates HTML",
      "200 contacts · 2 listes",
      "Tracking ouvertures & clics",
      "Logs 7 jours",
      "Support communautaire",
    ],
    isCustom: false,
  },
  {
    name:           "PRO",
    displayName:    "Pro",
    price:          35000,
    priceAnnual:    28000,    // -20% → économie 84 000 Ar/an
    emailsPerMonth: 10000,
    maxBulkSend:    500,
    apiKeysMax:     10,
    templatesMax:   50,
    contactsMax:    10000,
    listsMax:       -1,       // illimité
    workflowsMax:   20,
    logRetentionDays: 30,
    webhooks:       true,
    features: [
      "10 000 emails/mois",
      "10 clés API",
      "50 templates HTML",
      "10 000 contacts · listes illimitées",
      "20 workflows & automations",
      "Webhooks entrants & sortants",
      "Envoi en masse (CSV / Excel)",
      "Variables dynamiques entre nœuds",
      "Logs 30 jours",
      "Support par email",
    ],
    isCustom: false,
  },
  {
    name:           "BUSINESS",
    displayName:    "Business",
    price:          80000,
    priceAnnual:    64000,    // -20% → économie 192 000 Ar/an
    emailsPerMonth: 100000,
    maxBulkSend:    -1,       // illimité
    apiKeysMax:     -1,       // illimité
    templatesMax:   -1,       // illimité
    contactsMax:    -1,       // illimité
    listsMax:       -1,       // illimité
    workflowsMax:   -1,       // illimité
    logRetentionDays: 90,
    webhooks:       true,
    features: [
      "100 000 emails/mois",
      "Clés API illimitées",
      "Templates illimités",
      "Contacts & listes illimités",
      "Workflows & automations illimités",
      "Webhooks entrants & sortants",
      "Boucles & conditions avancées",
      "Pièces jointes",
      "Logs 90 jours",
      "SLA garanti 99.9%",
      "Support prioritaire 24/7",
    ],
    isCustom: false,
  },
];

async function seedPlans() {
  console.log("🌱 Seeding plans...");

  for (const plan of DEFAULT_PLANS) {
    const existing = await prisma.plan.findUnique({ where: { name: plan.name } });

    if (!existing) {
      await prisma.plan.create({ data: plan });
      console.log(`✅ Plan créé : ${plan.displayName}`);
    } else {
      // Mettre à jour si le plan existe déjà (pour appliquer les nouveaux prix)
      await prisma.plan.update({ where: { name: plan.name }, data: plan });
      console.log(`🔄 Plan mis à jour : ${plan.displayName}`);
    }
  }

  // Assigner le plan FREE aux users sans plan
  const freePlan = await prisma.plan.findUnique({ where: { name: "FREE" } });
  if (freePlan) {
    const updated = await prisma.user.updateMany({
      where: { planId: null },
      data:  { planId: freePlan.id },
    });
    if (updated.count > 0) {
      console.log(`👥 ${updated.count} utilisateur(s) assigné(s) au plan FREE`);
    }
  }

  console.log("✨ Seeding terminé !");
}

seedPlans()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });