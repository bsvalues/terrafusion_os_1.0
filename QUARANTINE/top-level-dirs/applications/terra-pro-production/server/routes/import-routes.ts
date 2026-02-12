import express from "express";
import multer from "multer";
import path from "path";
import { promises as fs } from "fs";
import { TerraFusionImportEngine, TerraFusionComp, ImportResult } from "../services/import-engine";

const router = express.Router();

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), "temp", "uploads");
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedExtensions = [".sqlite", ".db", ".sqlite3"];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only SQLite database files are supported"));
    }
  },
});

router.get("/formats", async (req, res) => {
  try {
    const formats = await TerraFusionImportEngine.getSupportedFormats();
    res.json({
      success: true,
      formats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to retrieve supported formats",
    });
  }
});

router.post("/detect-format", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No file uploaded",
      });
    }

    const format = await TerraFusionImportEngine.detectFormat(req.file.path);

    await fs.unlink(req.file.path).catch(() => {});

    res.json({
      success: true,
      format,
      filename: req.file.originalname,
    });
  } catch (error) {
    if (req.file) {
      await fs.unlink(req.file.path).catch(() => {});
    }

    res.status(500).json({
      success: false,
      error: "Failed to detect file format",
    });
  }
});

router.post("/import", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No file uploaded",
      });
    }

    const result: ImportResult = await TerraFusionImportEngine.importFile(req.file.path);

    await fs.unlink(req.file.path).catch(() => {});

    if (!result.success) {
      return res.status(400).json(result);
    }

    const { valid, invalid } = await TerraFusionImportEngine.validateImportedData(
      result.data || []
    );

    res.json({
      success: true,
      data: valid,
      stats: {
        ...result.stats,
        validRecords: valid.length,
        invalidRecords: invalid.length,
      },
      invalidRecords: invalid.length > 0 ? invalid.slice(0, 10) : undefined,
    });
  } catch (error) {
    if (req.file) {
      await fs.unlink(req.file.path).catch(() => {});
    }

    res.status(500).json({
      success: false,
      error: "Import process failed",
    });
  }
});

router.post("/import-and-store", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No file uploaded",
      });
    }

    const result: ImportResult = await TerraFusionImportEngine.importFile(req.file.path);

    await fs.unlink(req.file.path).catch(() => {});

    if (!result.success) {
      return res.status(400).json(result);
    }

    const { valid, invalid } = await TerraFusionImportEngine.validateImportedData(
      result.data || []
    );

    const storedProperties = [];
    for (const comp of valid) {
      try {
        const propertyData = {
          address: comp.address,
          city: comp.city || "",
          state: comp.state || "",
          zip: comp.zip_code || "",
          propertyType: comp.property_type || "Unknown",
          bedrooms: comp.bedrooms || null,
          bathrooms: comp.bathrooms || null,
          squareFeet: comp.gla_sqft || null,
          yearBuilt: comp.year_built || null,
          lotSize: comp.lot_size || null,
          metadata: {
            ...comp.metadata,
            importSource: comp.source_file,
            importTable: comp.source_table,
            salePrice: comp.sale_price_usd,
            saleDate: comp.sale_date,
          },
        };

        storedProperties.push(propertyData);
      } catch (error) {
        console.error("Failed to store property:", error);
      }
    }

    res.json({
      success: true,
      stored: storedProperties.length,
      totalImported: valid.length,
      invalidRecords: invalid.length,
      stats: result.stats,
    });
  } catch (error) {
    if (req.file) {
      await fs.unlink(req.file.path).catch(() => {});
    }

    res.status(500).json({
      success: false,
      error: "Import and store process failed",
    });
  }
});

export { router as importRoutes };
