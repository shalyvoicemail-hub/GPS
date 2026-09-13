const express = require("express");
const signal = require("../signalClient");

const router = express.Router();

// Returns the raw QR code PNG so the browser can just do <img src="/api/link/qrcode">.
router.get("/qrcode", async (req, res) => {
  try {
    const deviceName = typeof req.query.device_name === "string" ? req.query.device_name : undefined;
    const upstream = await signal.getLinkQrCodeResponse(deviceName);
    if (!upstream.ok) {
      const text = await upstream.text().catch(() => "");
      return res.status(upstream.status).json({ error: "Failed to fetch link QR code", details: text });
    }
    res.setHeader("Content-Type", upstream.headers.get("content-type") || "image/png");
    const buffer = Buffer.from(await upstream.arrayBuffer());
    res.send(buffer);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

router.get("/accounts", async (req, res) => {
  try {
    const accounts = await signal.listAccounts();
    res.json(accounts);
  } catch (err) {
    res.status(err.status || 502).json({ error: err.message, details: err.body });
  }
});

router.post("/register", async (req, res) => {
  try {
    const { number, useVoice } = req.body || {};
    if (!number) return res.status(400).json({ error: "number is required" });
    const result = await signal.registerNumber(number, Boolean(useVoice));
    res.json(result || { ok: true });
  } catch (err) {
    res.status(err.status || 502).json({ error: err.message, details: err.body });
  }
});

router.post("/verify", async (req, res) => {
  try {
    const { number, code } = req.body || {};
    if (!number || !code) return res.status(400).json({ error: "number and code are required" });
    const result = await signal.verifyNumber(number, code);
    res.json(result || { ok: true });
  } catch (err) {
    res.status(err.status || 502).json({ error: err.message, details: err.body });
  }
});

module.exports = router;
