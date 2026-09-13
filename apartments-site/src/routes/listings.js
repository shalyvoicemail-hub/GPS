const express = require("express");
const fs = require("fs");
const path = require("path");
const store = require("../store");
const { requireAdmin } = require("../middleware/auth");
const { upload, UPLOAD_DIR } = require("../upload");

const router = express.Router();

function parseAmenities(raw) {
  if (Array.isArray(raw)) return raw.map((a) => a.trim()).filter(Boolean);
  if (typeof raw === "string") return raw.split(",").map((a) => a.trim()).filter(Boolean);
  return [];
}

// --- Public routes ---

router.get("/", (req, res) => {
  let listings = store.listAll();
  const { city, minPrice, maxPrice, bedrooms, availableOnly } = req.query;

  if (city) {
    const needle = String(city).toLowerCase();
    listings = listings.filter((l) => l.city.toLowerCase().includes(needle));
  }
  if (minPrice) listings = listings.filter((l) => l.price >= Number(minPrice));
  if (maxPrice) listings = listings.filter((l) => l.price <= Number(maxPrice));
  if (bedrooms) listings = listings.filter((l) => l.bedrooms >= Number(bedrooms));
  if (availableOnly === "true") listings = listings.filter((l) => l.available);

  res.json(listings);
});

router.get("/:id", (req, res) => {
  const listing = store.getById(req.params.id);
  if (!listing) return res.status(404).json({ error: "Listing not found" });
  res.json(listing);
});

// --- Admin routes ---

router.post("/", requireAdmin, upload.array("images", 20), (req, res) => {
  const body = req.body || {};
  const images = (req.files || []).map((f) => f.filename);
  const listing = store.create({
    title: body.title,
    address: body.address,
    city: body.city,
    state: body.state,
    zip: body.zip,
    price: body.price,
    bedrooms: body.bedrooms,
    bathrooms: body.bathrooms,
    sqft: body.sqft,
    description: body.description,
    amenities: parseAmenities(body.amenities),
    contactName: body.contactName,
    contactPhone: body.contactPhone,
    contactEmail: body.contactEmail,
    available: body.available !== "false",
    images,
  });
  res.status(201).json(listing);
});

router.put("/:id", requireAdmin, upload.array("images", 20), (req, res) => {
  const body = req.body || {};
  const newImages = (req.files || []).map((f) => f.filename);
  const existing = store.getById(req.params.id);
  if (!existing) return res.status(404).json({ error: "Listing not found" });

  const fields = {
    title: body.title,
    address: body.address,
    city: body.city,
    state: body.state,
    zip: body.zip,
    description: body.description,
    contactName: body.contactName,
    contactPhone: body.contactPhone,
    contactEmail: body.contactEmail,
  };
  if (body.price !== undefined) fields.price = body.price;
  if (body.bedrooms !== undefined) fields.bedrooms = body.bedrooms;
  if (body.bathrooms !== undefined) fields.bathrooms = body.bathrooms;
  if (body.sqft !== undefined) fields.sqft = body.sqft;
  if (body.amenities !== undefined) fields.amenities = parseAmenities(body.amenities);
  if (body.available !== undefined) fields.available = body.available !== "false";
  if (newImages.length) fields.images = [...existing.images, ...newImages];

  const listing = store.update(req.params.id, fields);
  res.json(listing);
});

router.delete("/:id/images/:filename", requireAdmin, (req, res) => {
  const listing = store.removeImage(req.params.id, req.params.filename);
  if (!listing) return res.status(404).json({ error: "Listing not found" });

  const filePath = path.join(UPLOAD_DIR, path.basename(req.params.filename));
  fs.unlink(filePath, () => {});
  res.json(listing);
});

router.delete("/:id", requireAdmin, (req, res) => {
  const listing = store.remove(req.params.id);
  if (!listing) return res.status(404).json({ error: "Listing not found" });

  for (const filename of listing.images) {
    fs.unlink(path.join(UPLOAD_DIR, path.basename(filename)), () => {});
  }
  res.json({ ok: true });
});

module.exports = router;
