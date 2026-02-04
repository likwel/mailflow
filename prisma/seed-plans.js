const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const DEFAULT_PLANS = [
  {
    name: "FREE",
    displayName: "Gratuit",
    price: 0,
    emailsPerMonth: 100,
    maxBulkSend: 10,
    apiKeysMax: 2,
    templatesMax: 5,
    features: ["100 emails/mois", "2 clés API", "5 templates"],
    isCustom: false,
  },
  {
    name: "PRO",
    displayName: "Pro",
    price: 19,
    emailsPerMonth: 5000,
    maxBulkSend: 100,
    apiKeysMax: 10,
    templatesMax: 50,
    features: [
      "5 000 emails/mois",
      "10 clés API",
      "50 templates",
      "Support prioritaire",
    ],
    isCustom: false,
  },
  {
    name: "BUSINESS",
    displayName: "Business",
    price: 99,
    emailsPerMonth: 50000,
    maxBulkSend: 1000,
    apiKeysMax: 50,
    templatesMax: 200,
    features: [
      "50 000 emails/mois",
      "50 clés API",
      "Templates illimités",
      "Support 24/7",
      "SLA garanti",
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
      console.log(`⏭️  Plan existe déjà : ${plan.displayName}`);
    }
  }

  // Créer un plan FREE et l'assigner aux users existants sans plan
  const freePlan = await prisma.plan.findUnique({ where: { name: "FREE" } });
  
  await prisma.user.updateMany({
    where: { planId: null },
    data: { planId: freePlan.id },
  });

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