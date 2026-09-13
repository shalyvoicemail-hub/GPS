const statusBadge = document.getElementById("statusBadge");
const linkPanel = document.getElementById("linkPanel");
const chatPanel = document.getElementById("chatPanel");
const qrImage = document.getElementById("qrImage");
const refreshQrBtn = document.getElementById("refreshQr");
const chatLog = document.getElementById("chatLog");
const sendForm = document.getElementById("sendForm");
const recipientInput = document.getElementById("recipient");
const messageInput = document.getElementById("messageText");

function loadQrCode() {
  qrImage.src = `/api/link/qrcode?device_name=signal-connect-app&t=${Date.now()}`;
}

function appendMessage({ from, text, outgoing }) {
  const div = document.createElement("div");
  div.className = `msg ${outgoing ? "out" : "in"}`;
  div.innerHTML = `<span class="from">${outgoing ? "You" : from}</span>${text}`;
  chatLog.appendChild(div);
  chatLog.scrollTop = chatLog.scrollHeight;
}

function extractText(envelope) {
  const dm = envelope?.envelope?.dataMessage;
  return dm && dm.message ? dm.message : null;
}

async function init() {
  try {
    const res = await fetch("/api/config");
    const config = await res.json();

    if (config.number) {
      statusBadge.textContent = `connected as ${config.number}`;
      statusBadge.className = "badge online";
      linkPanel.hidden = true;
      chatPanel.hidden = false;
      startStream();
    } else {
      statusBadge.textContent = "not linked yet";
      statusBadge.className = "badge offline";
      linkPanel.hidden = false;
      chatPanel.hidden = true;
      loadQrCode();
    }
  } catch (err) {
    statusBadge.textContent = "server unreachable";
    statusBadge.className = "badge offline";
  }
}

function startStream() {
  const source = new EventSource("/api/messages/stream");
  source.addEventListener("message", (event) => {
    const envelope = JSON.parse(event.data);
    const text = extractText(envelope);
    if (text) {
      appendMessage({ from: envelope.envelope.sourceNumber || envelope.envelope.source, text, outgoing: false });
    }
  });
  source.addEventListener("error", () => {
    statusBadge.textContent = "stream error, retrying…";
    statusBadge.className = "badge offline";
  });
}

sendForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const recipient = recipientInput.value.trim();
  const message = messageInput.value.trim();
  if (!recipient || !message) return;

  appendMessage({ text: message, outgoing: true });
  messageInput.value = "";

  try {
    const res = await fetch("/api/messages/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipient, message }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      appendMessage({ text: `⚠️ failed to send: ${body.error || res.status}`, outgoing: false, from: "system" });
    }
  } catch (err) {
    appendMessage({ text: `⚠️ failed to send: ${err.message}`, outgoing: false, from: "system" });
  }
});

refreshQrBtn.addEventListener("click", loadQrCode);

init();
