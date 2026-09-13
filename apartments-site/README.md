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

- Listing data: `data/listings.json` (created automatically, gitignored).
- Uploaded photos: `public/uploads/` (gitignored).

Both are local to wherever you run the app — back them up if you care about
the listings you add. There's no built-in export; if you need one, the
JSON file is plain, readable data.

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
