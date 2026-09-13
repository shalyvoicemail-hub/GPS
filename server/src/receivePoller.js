const signal = require("./signalClient");
const bus = require("./messageBus");

let timer = null;

/** Repeatedly drains signal-cli-rest-api's receive queue and broadcasts new envelopes to SSE clients. */
function start(number, intervalMs) {
  if (!number || timer) return;

  const tick = async () => {
    try {
      const envelopes = await signal.receiveMessages(number);
      for (const envelope of envelopes || []) {
        bus.broadcast("message", envelope);
      }
    } catch (err) {
      bus.broadcast("error", { message: err.message });
    } finally {
      timer = setTimeout(tick, intervalMs);
    }
  };

  timer = setTimeout(tick, 0);
}

function stop() {
  if (timer) clearTimeout(timer);
  timer = null;
}

module.exports = { start, stop };
