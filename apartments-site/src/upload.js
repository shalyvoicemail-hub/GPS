const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "..", "data");
const UPLOAD_DIR = path.join(DATA_DIR, "uploads");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function fileFilter(req, file, cb) {
  if (ALLOWED_TYPES.has(file.mimetype)) return cb(null, true);
  cb(new Error("Only JPEG, PNG, WEBP, or GIF images are allowed"));
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 8 * 1024 * 1024, files: 20 },
});

module.exports = { upload, UPLOAD_DIR };
