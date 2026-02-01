// =====================================================
// middleware/apiKeyAuth.js — Vérifie l'API Key (public)
// =====================================================
const crypto = require("crypto");

const hashKey = (key) =>
  crypto.createHash("sha256").update(key).digest("hex");

const apiKeyAuth = async (req, res, next) => {
  const apiKey = req.headers["x-api-key"] || req.headers.authorization?.replace("Bearer ", "");

  if (!apiKey) return res.status(401).json({ error: "API Key manquante" });

  try {
    const hashed = hashKey(apiKey);
    const keyRecord = await prisma.apiKey.findUnique({
      where: { key: hashed },
      include: { user: true },
    });

    if (!keyRecord || !keyRecord.isActive) {
      return res.status(401).json({ error: "API Key invalide ou désactivée" });
    }

    // Met à jour lastUsed
    await prisma.apiKey.update({
      where: { id: keyRecord.id },
      data: { lastUsed: new Date() },
    });

    req.apiKey = keyRecord;
    req.user = keyRecord.user;
    next();
  } catch (e) {
    res.status(500).json({ error: "Erreur interne" });
  }
};

module.exports = { apiKeyAuth, hashKey };