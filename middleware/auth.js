// =====================================================
// middleware/auth.js — Vérifie la session JWT (admin)
// =====================================================
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1] ||
                req.cookies?.session_token;

  if (!token) return res.status(401).json({ error: "Non authentifié" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const session = await prisma.session.findUnique({
      where: { token: decoded.sessionToken },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) {
      return res.status(401).json({ error: "Session expirée" });
    }

    req.user = session.user;
    next();
  } catch {
    res.status(401).json({ error: "Token invalide" });
  }
};

module.exports = { authMiddleware };