# Signal Connect

A small web app that connects to Signal: link your existing Signal account
(via QR code, like Signal Desktop does) or register a new number, then send
and receive messages from a simple chat UI in your browser.

It does not reimplement the Signal protocol. Instead it drives
[`signal-cli`](https://github.com/AsamK/signal-cli) through
[`signal-cli-rest-api`](https://github.com/bbernhard/signal-cli-rest-api), a
well-maintained REST wrapper, and exposes a thin app on top of it.

## Architecture

```
Browser (public/) ── HTTP/SSE ──> Express server (server/src) ── REST ──> signal-cli-rest-api ── Signal servers
```

- **`signal-cli-rest-api`** — runs as its own container, holds the actual
  linked Signal identity/keys, and talks to Signal's servers.
- **`server/`** — a small Express app that proxies linking/sending to
  `signal-cli-rest-api`, polls it for incoming messages, and pushes them to
  the browser over Server-Sent Events.
- **`server/public/`** — the browser UI: a linking screen (QR code) and a
  minimal chat screen.

## Running it

Requires Docker (for `signal-cli-rest-api`) — running your own Signal client
requires holding real Signal account keys, which only `signal-cli` provides.

```bash
docker compose up -d --build
```

This starts `signal-cli-rest-api` on `:8080` and the app on `:3000`.

1. Open http://localhost:3000 — you'll see a QR code.
2. On your phone: Signal → **Settings → Linked devices → Link new device**,
   then scan it. This links the app as an additional device on your existing
   Signal account (nothing about your primary phone/number changes).
3. Once linked, find your number's account id:
   ```bash
   curl http://localhost:8080/v1/accounts
   ```
4. Set it as `SIGNAL_NUMBER` (in a `.env` file next to `docker-compose.yml`,
   or `server/.env` for local runs) and restart:
   ```bash
   echo "SIGNAL_NUMBER=+15551234567" >> .env
   docker compose up -d
   ```
5. Reload http://localhost:3000 — you should now see the chat screen. Send a
   message to any number, and incoming messages appear live.

### Running the app without Docker

You still need `signal-cli-rest-api` reachable somewhere (Docker is the
easiest way to run that piece specifically, since it bundles `signal-cli`
and Java). With that running:

```bash
cd server
cp .env.example .env   # then fill in SIGNAL_API_URL / SIGNAL_NUMBER
npm install
npm start
```

### Registering a brand-new number instead of linking

If you'd rather register a new Signal number for this app (instead of
linking it to your existing phone), use the REST API directly:

```bash
curl -X POST http://localhost:8080/v1/register/+15551234567 \
  -H 'Content-Type: application/json' -d '{"use_voice": false}'

# Signal texts/calls a code to that number, then:
curl -X POST http://localhost:8080/v1/register/+15551234567/verify/123456
```

(The app also exposes `/api/link/register` and `/api/link/verify` that do
the same thing, if you'd rather build a UI for it.)

## API reference (this app's own server)

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/config` | Returns `{ number }` — whether an account is configured |
| `GET` | `/api/link/qrcode` | PNG QR code for linking a new device |
| `GET` | `/api/link/accounts` | Lists accounts known to `signal-cli-rest-api` |
| `POST` | `/api/link/register` | `{ number, useVoice }` — register a new number |
| `POST` | `/api/link/verify` | `{ number, code }` — complete registration |
| `POST` | `/api/messages/send` | `{ recipient, message }` — send a text |
| `GET` | `/api/messages/stream` | Server-Sent Events stream of incoming messages |

## Notes & limitations

- This links as a **secondary device**; your phone's Signal app remains the
  primary device and must stay set up.
- `signal-cli-rest-api`'s receive endpoint drains its queue on each call —
  this app polls it (`RECEIVE_POLL_INTERVAL_MS`, default 3s) and rebroadcasts
  to the browser, so message delivery has a few seconds of latency, not
  instant push.
- Group messaging, attachments, and reactions aren't wired into the UI yet,
  though `signal-cli-rest-api` supports them — extend `signalClient.js` and
  the routes as needed.
- Keep the `signal-cli-config` Docker volume (or `~/.local/share/signal-cli`
  if running signal-cli directly) safe — it holds your linked device's keys.
