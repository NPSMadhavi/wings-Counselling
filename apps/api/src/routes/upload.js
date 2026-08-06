import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import sharp from "sharp";
import { requireAdmin } from "../middlewares/auth.js";

const router = Router();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.resolve(__dirname, "../../uploads");

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Use memoryStorage so Sharp can process file buffers in memory before saving to disk
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 8 * 1024 * 1024, // 8MB limit
    files: 10,
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype?.startsWith("image/")) {
      cb(null, true);
      return;
    }
    cb(new Error("Only image files are allowed"));
  },
});

/**
 * POST /admin/upload
 * Refactored Sharp processing pipeline for natural-looking, high-quality web images.
 * Preserves skin tones, avoids white speckles, and optimizes images for fast web loading.
 */
router.post("/admin/upload", requireAdmin, (req, res) => {
  upload.array("files", 10)(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: err.message });
    }

    if (err) {
      return res.status(400).json({ error: err.message || "Upload failed" });
    }

    const files = Array.isArray(req.files) ? req.files : [];

    if (!files.length) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    try {
      const uploadType = req.body?.type || req.query?.type;

      const urls = await Promise.all(
        files.map(async (file) => {
          // Generate unique filename preserving existing convention
          const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
          const filename = `${uniqueId}.jpg`;
          const outputPath = path.join(uploadDir, filename);

          // 1. Initialize Sharp pipeline and auto-rotate based on EXIF metadata
          let pipeline = sharp(file.buffer).rotate();

          // 2. Single metadata read for orientation & dimensions
          const metadata = await pipeline.metadata();

          // 3. Determine target max dimensions based on image usage & orientation
          const isPortrait = metadata.width && metadata.height && metadata.width <= metadata.height * 1.25;

          let targetWidth = 3840;
          let targetHeight = 2160;

          if (uploadType === "member" || (isPortrait && uploadType !== "hero" && uploadType !== "group")) {
            // Team Member Profile Image: max 800 × 1200 px (fit: inside) - UNCHANGED
            targetWidth = 800;
            targetHeight = 1200;
          } else {
            // Team Group Hero Image: max 3840 × 2160 px (4K UHD) (fit: inside)
            // Preserves maximum resolution so facial details across group members remain crystal clear
            targetWidth = 3840;
            targetHeight = 2160;
          }

          // 4. Flatten transparent backgrounds only if the source image has an alpha channel
          if (metadata.hasAlpha) {
            pipeline = pipeline.flatten({ background: "#ffffff" });
          }

          // 5. Apply optimized resize & JPEG encoding without artificial sharpening
          await pipeline
            .resize(targetWidth, targetHeight, {
              fit: "inside",
              withoutEnlargement: true,
              fastShrinkOnLoad: true,
            })
            .jpeg({
              quality: 90,
              mozjpeg: true,
              progressive: true,
            })
            .toFile(outputPath);

          return `/api/uploads/${filename}`;
        })
      );

      return res.json({ urls });
    } catch (processErr) {
      console.error("Error processing image upload with Sharp:", processErr);
      return res.status(500).json({ error: "Failed to process and optimize image" });
    }
  });
});

export default router;
