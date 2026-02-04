// =====================================================
// routes/auth.js — Register / Login / Me / Logout
// =====================================================
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// ─── Register ─────────────────────────────────────────
router.post("/register", async (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name)
    return res.status(400).json({ error: "Email, mot de passe et nom sont requis" });

  if (password.length < 6)
    return res.status(400).json({ error: "Le mot de passe doit avoir au moins 6 caractères" });

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing)
      return res.status(409).json({ error: "Email déjà utilisé" });

    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, name, password: hash },
    });

    // Créer session et retourner token
    const { jwtToken } = await createSession(user.id);

    res.status(201).json({ token: jwtToken });
  } catch (e) {
    console.error("Register error:", e.message);
    res.status(500).json({ error: "Erreur lors de la création du compte" });
  }
});

// ─── Login ────────────────────────────────────────────
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: "Email et mot de passe sont requis" });

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.password)
      return res.status(401).json({ error: "Email ou mot de passe incorrect" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      return res.status(401).json({ error: "Email ou mot de passe incorrect" });

    const { jwtToken } = await createSession(user.id);

    res.json({ token: jwtToken });
  } catch (e) {
    console.error("Login error:", e.message);
    res.status(500).json({ error: "Erreur lors de la connexion" });
  }
});

// ─── Vérifier la session courante ─────────────────────
router.get("/me", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Non authentifié" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const session = await prisma.session.findUnique({
      where: { token: decoded.sessionToken },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date())
      return res.status(401).json({ error: "Session expirée" });

    const { user } = session;
    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      plan: user.plan,
      role: user.role,
      emailsUsed: user.emailsUsed,
    });
  } catch {
    res.status(401).json({ error: "Token invalide" });
  }
});

// ─── Logout ───────────────────────────────────────────
router.post("/logout", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    await prisma.session.deleteMany({ where: { token: decoded.sessionToken } });
  } catch {}
  res.json({ ok: true });
});

// ─── Helper : créer une session + JWT ─────────────────
async function createSession(userId) {
  const sessionToken = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 jours

  await prisma.session.create({
    data: { userId, token: sessionToken, expiresAt },
  });

  const jwtToken = jwt.sign(
    { userId, sessionToken },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  return { jwtToken, sessionToken };
}

module.exports = router;