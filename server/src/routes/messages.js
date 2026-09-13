const express = require("express");
const signal = require("../signalClient");
const bus = require("../messageBus");

const router = express.Router();

router.post("/send", async (req, res) => {
  try {
    const { recipient, recipients, message } = req.body || {};
    const targets = recipients || (recipient ? [recipient] : null);
    if (!targets || !targets.length || !message) {
      return res.status(400).json({ error: "recipient (or recipients) and message are required" });
    }
    const number = process.env.SIGNAL_NUMBER;
    if (!number) {
      return res.status(409).json({ error: "SIGNAL_NUMBER is not configured on the server" });
    }
    const result = await signal.sendMessage({ number, recipients: targets, message });
    res.json(result || { ok: true });
  } catch (err) {
    res.status(err.status || 502).json({ error: err.message, details: err.body });
  }
});

// Server-Sent Events stream of incoming messages, pushed as the poller drains them.
router.get("/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  bus.addClient(res);
  res.write(`event: connected\ndata: {}\n\n`);

  req.on("close", () => bus.removeClient(res));
});

module.exports = router;
