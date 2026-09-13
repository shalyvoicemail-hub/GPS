require("dotenv").config();
const path = require("path");
const express = require("express");

const linkRoutes = require("./routes/link");
const messageRoutes = require("./routes/messages");
const receivePoller = require("./receivePoller");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

app.get("/api/config", (req, res) => {
  res.json({ number: process.env.SIGNAL_NUMBER || null });
});

app.use("/api/link", linkRoutes);
app.use("/api/messages", messageRoutes);

app.listen(PORT, () => {
  console.log(`Signal-connect app listening on http://localhost:${PORT}`);

  const number = process.env.SIGNAL_NUMBER;
  const intervalMs = Number(process.env.RECEIVE_POLL_INTERVAL_MS) || 3000;
  if (number) {
    console.log(`Polling signal-cli-rest-api for incoming messages on ${number} every ${intervalMs}ms`);
    receivePoller.start(number, intervalMs);
  } else {
    console.log("SIGNAL_NUMBER not set yet — link/register an account, then set it and restart.");
  }
});
