// Small file-backed JSON store — no database server needed for a single-owner
// listings site. Every write rewrites the whole file, which is plenty fast
// for the number of listings one person manages.

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const DATA_FILE = path.join(__dirname, "..", "data", "listings.json");

function load() {
  if (!fs.existsSync(DATA_FILE)) return [];
  const raw = fs.readFileSync(DATA_FILE, "utf8").trim();
  return raw ? JSON.parse(raw) : [];
}

function save(listings) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(listings, null, 2));
}

function listAll() {
  return load().sort((a, b) => b.createdAt - a.createdAt);
}

function getById(id) {
  return load().find((l) => l.id === id) || null;
}

function create(fields) {
  const listings = load();
  const listing = {
    id: crypto.randomUUID(),
    title: fields.title || "",
    address: fields.address || "",
    city: fields.city || "",
    state: fields.state || "",
    zip: fields.zip || "",
    price: Number(fields.price) || 0,
    bedrooms: Number(fields.bedrooms) || 0,
    bathrooms: Number(fields.bathrooms) || 0,
    sqft: Number(fields.sqft) || 0,
    description: fields.description || "",
    amenities: fields.amenities || [],
    contactName: fields.contactName || "",
    contactPhone: fields.contactPhone || "",
    contactEmail: fields.contactEmail || "",
    available: fields.available !== false,
    images: fields.images || [],
    createdAt: Date.now(),
  };
  listings.push(listing);
  save(listings);
  return listing;
}

function update(id, fields) {
  const listings = load();
  const idx = listings.findIndex((l) => l.id === id);
  if (idx === -1) return null;

  const current = listings[idx];
  const updated = {
    ...current,
    ...fields,
    price: fields.price !== undefined ? Number(fields.price) : current.price,
    bedrooms: fields.bedrooms !== undefined ? Number(fields.bedrooms) : current.bedrooms,
    bathrooms: fields.bathrooms !== undefined ? Number(fields.bathrooms) : current.bathrooms,
    sqft: fields.sqft !== undefined ? Number(fields.sqft) : current.sqft,
    id: current.id,
    createdAt: current.createdAt,
  };
  listings[idx] = updated;
  save(listings);
  return updated;
}

function addImages(id, filenames) {
  const listing = getById(id);
  if (!listing) return null;
  return update(id, { images: [...listing.images, ...filenames] });
}

function removeImage(id, filename) {
  const listing = getById(id);
  if (!listing) return null;
  return update(id, { images: listing.images.filter((f) => f !== filename) });
}

function remove(id) {
  const listings = load();
  const filtered = listings.filter((l) => l.id !== id);
  const removedListing = listings.find((l) => l.id === id) || null;
  save(filtered);
  return removedListing;
}

module.exports = { listAll, getById, create, update, addImages, removeImage, remove };
