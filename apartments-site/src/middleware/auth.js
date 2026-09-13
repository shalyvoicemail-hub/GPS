function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin) return next();
  res.status(401).json({ error: "Admin login required" });
}

module.exports = { requireAdmin };
