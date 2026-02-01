// =====================================================
// middleware/rateLimiter.js
// =====================================================
const rateLimiter = (maxRequests, windowMs) => {
  const store = new Map(); // En mémoire pour simplifier (en prod: Redis)

  return (req, res, next) => {
    const key = req.user?.id || req.ip;
    const now = Date.now();
    const windowStart = now - windowMs;

    const requests = (store.get(key) || []).filter((t) => t > windowStart);

    if (requests.length >= maxRequests) {
      return res.status(429).json({
        error: "Limite de requêtes dépassée",
        retryAfter: Math.ceil((requests[0] + windowMs - now) / 1000),
      });
    }

    requests.push(now);
    store.set(key, requests);
    next();
  };
};

module.exports = { rateLimiter };