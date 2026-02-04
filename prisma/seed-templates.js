const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const SYSTEM_TEMPLATES = [
  {
    name: "Email de bienvenue",
    subject: "Bienvenue sur {{platform}} !",
    htmlBody: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #6366f1;">Bonjour {{name}} 👋</h1>
        <p style="font-size: 16px; line-height: 1.6;">
          Bienvenue sur <strong>{{platform}}</strong> ! Nous sommes ravis de vous compter parmi nous.
        </p>
        <p style="font-size: 16px; line-height: 1.6;">
          Votre compte est maintenant actif et prêt à être utilisé.
        </p>
        <div style="margin: 30px 0; text-align: center;">
          <a href="{{loginUrl}}" style="background: #6366f1; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">
            Accéder à mon compte
          </a>
        </div>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 40px;">
          Si vous n'avez pas créé ce compte, ignorez cet email.
        </p>
      </div>
    `,
    textBody: "Bonjour {{name}}, bienvenue sur {{platform}} ! Votre compte est prêt.",
    type: "SYSTEM",
  },
  {
    name: "Réinitialisation de mot de passe",
    subject: "Réinitialiser votre mot de passe",
    htmlBody: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #ef4444;">Réinitialisation de mot de passe</h1>
        <p style="font-size: 16px; line-height: 1.6;">
          Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous pour continuer :
        </p>
        <div style="margin: 30px 0; text-align: center;">
          <a href="{{resetLink}}" style="background: #ef4444; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">
            Réinitialiser mon mot de passe
          </a>
        </div>
        <p style="font-size: 14px; color: #64748b;">
          Ce lien expire dans <strong>24 heures</strong>.
        </p>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 40px;">
          Si vous n'avez pas demandé cette réinitialisation, ignorez cet email. Votre mot de passe restera inchangé.
        </p>
      </div>
    `,
    textBody: "Cliquez sur ce lien pour réinitialiser votre mot de passe : {{resetLink}} (expire dans 24h)",
    type: "SYSTEM",
  },
];

async function seedTemplates() {
  console.log("🌱 Seeding templates système...");

  for (const template of SYSTEM_TEMPLATES) {
    const existing = await prisma.template.findFirst({
      where: { name: template.name, type: "SYSTEM" },
    });

    if (!existing) {
      await prisma.template.create({ data: template });
      console.log(`✅ Template créé : ${template.name}`);
    } else {
      console.log(`⏭️  Template existe déjà : ${template.name}`);
    }
  }

  console.log("✨ Seeding terminé !");
}

seedTemplates()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });