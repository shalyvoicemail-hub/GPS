const SIGNAL_API_URL = (process.env.SIGNAL_API_URL || "http://localhost:8080").replace(/\/+$/, "");

class SignalApiError extends Error {
  constructor(message, status, body) {
    super(message);
    this.name = "SignalApiError";
    this.status = status;
    this.body = body;
  }
}

async function request(path, options = {}) {
  const res = await fetch(`${SIGNAL_API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    let body;
    try {
      body = await res.json();
    } catch {
      body = await res.text().catch(() => "");
    }
    throw new SignalApiError(
      `signal-cli-rest-api request failed: ${options.method || "GET"} ${path} -> ${res.status}`,
      res.status,
      body
    );
  }

  if (res.status === 204) return null;
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return res.json();
  return res;
}

/** List accounts already registered/linked in signal-cli-rest-api. */
function listAccounts() {
  return request("/v1/accounts");
}

/**
 * Fetch a QR code (as a raw image response) that, when scanned from
 * Signal's mobile app (Settings > Linked devices > Link new device),
 * links this app as a secondary device on the user's existing account.
 */
function getLinkQrCodeResponse(deviceName) {
  const qs = new URLSearchParams({ device_name: deviceName || "signal-connect-app" });
  return fetch(`${SIGNAL_API_URL}/v1/qrcodelink?${qs.toString()}`);
}

/** Begin registering a brand-new number directly with Signal (alternative to linking). */
function registerNumber(number, useVoice = false) {
  return request(`/v1/register/${encodeURIComponent(number)}`, {
    method: "POST",
    body: JSON.stringify({ use_voice: useVoice }),
  });
}

/** Complete registration with the verification code Signal sent. */
function verifyNumber(number, code) {
  return request(`/v1/register/${encodeURIComponent(number)}/verify/${encodeURIComponent(code)}`, {
    method: "POST",
  });
}

/** Send a text message to one or more recipients (phone numbers or group IDs). */
function sendMessage({ number, recipients, message }) {
  return request("/v2/send", {
    method: "POST",
    body: JSON.stringify({ number, recipients, message }),
  });
}

/** Pull any messages that have arrived since the last call (signal-cli-rest-api drains its queue on read). */
function receiveMessages(number) {
  return request(`/v1/receive/${encodeURIComponent(number)}`);
}

module.exports = {
  SignalApiError,
  listAccounts,
  getLinkQrCodeResponse,
  registerNumber,
  verifyNumber,
  sendMessage,
  receiveMessages,
};
