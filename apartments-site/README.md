# RentFinder — your own apartments.com-style listings site

A self-hosted apartment listings website: visitors browse and search
available units with photos and details, and you manage listings yourself
from a password-protected admin page.

## Features

- **Public site** (`index.html`) — grid of listing cards with photo, price,
  beds/baths, and city; search by city, price range, and minimum bedrooms.
- **Listing detail page** (`listing.html`) — photo gallery, full description,
  amenities, specs, and contact info.
- **Admin page** (`admin.html`) — password-protected: add new listings with
  multiple photo uploads, edit existing ones, remove individual photos, or
  delete a listing entirely.
- No external database or service required — listings are stored in a local
  JSON file and photos on local disk.

## Running it

```bash
cd apartments-site
cp .env.example .env   # set ADMIN_PASSWORD and SESSION_SECRET
npm install
npm start
```

Then open:

- **http://localhost:4000** — the public site.
- **http://localhost:4000/admin.html** — log in with `ADMIN_PASSWORD` from
  your `.env`, then add your apartments (title, address, price, beds/baths,
  square footage, description, amenities, contact info, and photos).

Listings you add immediately show up on the public site.

## Data storage

- Listing data: `<DATA_DIR>/listings.json`.
- Uploaded photos: `<DATA_DIR>/uploads/`.

`DATA_DIR` defaults to `apartments-site/data` (gitignored) for local runs. In
production (see Deploying below) it points at a persistent volume instead, so
listings and photos survive restarts and redeploys. There's no built-in
export; if you need one, the JSON file is plain, readable data.

## Deploying it publicly (Fly.io)

This repo includes a `Dockerfile`, `fly.toml`, and a GitHub Actions workflow
(`.github/workflows/deploy-apartments-site.yml`) that deploys automatically
on every push. One-time setup, no local CLI install needed:

1. **Create a free Fly.io account** at https://fly.io.
2. **Generate an API token**: in the Fly dashboard, go to
   *Account → Access Tokens* and create one.
3. **Add repo secrets** in GitHub (Settings → Secrets and variables →
   Actions → New repository secret):
   - `FLY_API_TOKEN` — the token from step 2.
   - `ADMIN_PASSWORD` — the password you'll use to log into `/admin.html`.
   - `SESSION_SECRET` — any long random string.
4. *(Optional)* Add a repo **variable** `FLY_APP_NAME` with a globally-unique
   name (e.g. `yourname-rentfinder`) if you want to pick your own subdomain.
   Otherwise a name is generated automatically.
5. **Push to this branch**, or run the workflow manually from the Actions
   tab. It creates the Fly app and a persistent volume (first run only),
   sets secrets, and deploys.

Your site will be live at `https://<app-name>.fly.dev` — the workflow logs
print the exact URL on each run. Every subsequent push to `apartments-site/`
redeploys automatically; your listings and photos persist across deploys
because they live on the mounted volume, not the container.

If a run fails with "name already taken", someone else has that app name
globally — set `FLY_APP_NAME` to something more unique and re-run.

## API

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/listings` | public | List listings; supports `?city=&minPrice=&maxPrice=&bedrooms=&availableOnly=true` |
| `GET` | `/api/listings/:id` | public | Get one listing |
| `POST` | `/api/listings` | admin | Create a listing (multipart form, `images` field for photos) |
| `PUT` | `/api/listings/:id` | admin | Update a listing / add more photos |
| `DELETE` | `/api/listings/:id/images/:filename` | admin | Remove one photo |
| `DELETE` | `/api/listings/:id` | admin | Delete a listing and its photos |
| `POST` | `/api/auth/login` | — | `{ password }` → starts an admin session |
| `POST` | `/api/auth/logout` | — | Ends the admin session |
| `GET` | `/api/auth/session` | — | `{ isAdmin }` |

## Notes

- This is a single-admin app: whoever knows `ADMIN_PASSWORD` can manage all
  listings. There's no per-user accounts or multi-landlord support.
- Uploaded images are served as static files straight from `public/uploads/`
  — fine for a personal site, but put it behind HTTPS before sharing the
  admin URL anywhere untrusted, since the login posts a plaintext password.
- To deploy publicly, put this behind a reverse proxy with TLS (Caddy,
  Nginx, etc.) and set real values for `ADMIN_PASSWORD` and
  `SESSION_SECRET` in `.env`.
