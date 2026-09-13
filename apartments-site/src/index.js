require("dotenv").config();
const path = require("path");
const express = require("express");
const session = require("express-session");

const authRoutes = require("./routes/auth");
const listingRoutes = require("./routes/listings");

const app = express();
const PORT = process.env.PORT || 4000;

if (!process.env.SESSION_SECRET) {
  console.warn("SESSION_SECRET is not set — using an insecure default. Set it in .env before deploying.");
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev-only-insecure-secret",
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, maxAge: 1000 * 60 * 60 * 8 },
  })
);

app.use(express.static(path.join(__dirname, "..", "public")));

app.use("/api/auth", authRoutes);
app.use("/api/listings", listingRoutes);

// Multer / generic error handler so bad uploads return JSON, not a stack trace.
app.use((err, req, res, next) => {
  if (err) return res.status(400).json({ error: err.message });
  next();
});

app.listen(PORT, () => {
  console.log(`Apartments site listening on http://localhost:${PORT}`);
  console.log(`Admin page: http://localhost:${PORT}/admin.html`);
});
