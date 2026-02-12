import { Router, Request, Response } from "express";
import multer from "multer";
import { z } from "zod";
import { storage } from "../storage";
import {
  insertLegacyImportJobSchema,
  insertLegacyImportRecordSchema,
  insertLegacySystemTemplateSchema,
} from "@shared/schema";
import path from "path";
import fs from "fs/promises";
import { XMLParser } from "fast-xml-parser";
import * as csvParse from "csv-parse/sync";
import JSZip from "jszip";

const router = Router();

// Configure multer for file uploads
const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept various legacy file formats
    const allowedExtensions = [".zip", ".xml", ".env", ".sql", ".csv", ".pdf", ".xlsx", ".xls"];
    const fileExtension = path.extname(file.originalname).toLowerCase();

    if (allowedExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${fileExtension} not supported`), false);
    }
  },
});

// Legacy system detection patterns
const SYSTEM_PATTERNS = {
  TOTAL: {
    fileTypes: [".xml", ".env"],
    identifiers: ["TOTAL", "total_system", "subject_property", "comparable_sales"],
  },
  CLICKFORMS: {
    fileTypes: [".sql", ".xml"],
    identifiers: ["clickforms", "cf_", "appraisal_form", "form_data"],
  },
  ACI: {
    fileTypes: [".xml", ".csv"],
    identifiers: ["aci_", "appraisal_desktop", "aci_system"],
  },
  DATAMASTER: {
    fileTypes: [".csv", ".xlsx"],
    identifiers: ["datamaster", "dm_", "property_record", "sales_data"],
  },
  ALAMODE: {
    fileTypes: [".xml", ".env"],
    identifiers: ["alamode", "wintotak", "appraisal_report"],
  },
};

// File extraction and analysis functions
async function extractZipFile(filePath: string): Promise<any[]> {
  const data = await fs.readFile(filePath);
  const zip = new JSZip();
  const zipContents = await zip.loadAsync(data);
  const extractedFiles = [];

  for (const [filename, file] of Object.entries(zipContents.files)) {
    if (!file.dir) {
      const content = await file.async("string");
      extractedFiles.push({
        filename,
        content,
        size: content.length,
        type: path.extname(filename).toLowerCase(),
      });
    }
  }

  return extractedFiles;
}

async function parseXMLFile(content: string): Promise<any> {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
  });
  return parser.parse(content);
}

async function parseCSVFile(content: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const results: any[] = [];
    const parser = csv.parse({
      columns: true,
      skip_empty_lines: true,
    });

    parser.on("readable", function () {
      let record;
      while ((record = parser.read())) {
        results.push(record);
      }
    });

    parser.on("error", reject);
    parser.on("end", () => resolve(results));
    parser.write(content);
    parser.end();
  });
}

function detectLegacySystem(files: any[]): string[] {
  const detectedSystems = new Set<string>();

  for (const file of files) {
    const filename = file.filename || file.originalname || "";
    const content = file.content || "";
    const fileType = path.extname(filename).toLowerCase();

    for (const [systemName, pattern] of Object.entries(SYSTEM_PATTERNS)) {
      if (pattern.fileTypes.includes(fileType)) {
        const hasIdentifier = pattern.identifiers.some(
          (identifier) =>
            filename.toLowerCase().includes(identifier.toLowerCase()) ||
            content.toLowerCase().includes(identifier.toLowerCase())
        );

        if (hasIdentifier) {
          detectedSystems.add(systemName);
        }
      }
    }
  }

  return Array.from(detectedSystems);
}

function generateFieldMappings(extractedData: any, systemType: string): any {
  const commonMappings = {
    // Property mappings
    subject_address: "address",
    property_address: "address",
    street_address: "address",
    subject_city: "city",
    property_city: "city",
    subject_state: "state",
    property_state: "state",
    subject_zip: "zip",
    postal_code: "zip",
    zip_code: "zip",
    bedrooms: "bedrooms",
    bed_rooms: "bedrooms",
    room_count_bedrooms: "bedrooms",
    bathrooms: "bathrooms",
    bath_rooms: "bathrooms",
    room_count_bathrooms: "bathrooms",
    square_feet: "squareFeet",
    gross_living_area: "squareFeet",
    gla: "squareFeet",
    total_square_feet: "squareFeet",
    lot_size: "lotSize",
    site_size: "lotSize",
    year_built: "yearBuilt",
    effective_year_built: "yearBuilt",

    // Valuation mappings
    sale_price: "valuationAmount",
    sales_price: "valuationAmount",
    appraised_value: "valuationAmount",
    market_value: "valuationAmount",
    final_value: "valuationAmount",

    // Comparable mappings
    comp_1_address: "comparables[0].address",
    comp_2_address: "comparables[1].address",
    comp_3_address: "comparables[2].address",
    comparable_1_price: "comparables[0].salePrice",
    comparable_2_price: "comparables[1].salePrice",
    comparable_3_price: "comparables[2].salePrice",
  };

  // System-specific mappings
  const systemMappings = {
    TOTAL: {
      total_subject_property: "property",
      total_comparable_sales: "comparables",
      total_final_reconciliation: "valuationAmount",
    },
    CLICKFORMS: {
      cf_property_data: "property",
      cf_sales_comparison: "comparables",
      cf_value_conclusion: "valuationAmount",
    },
    ACI: {
      aci_subject: "property",
      aci_comps: "comparables",
      aci_value: "valuationAmount",
    },
  };

  return {
    ...commonMappings,
    ...(systemMappings[systemType] || {}),
  };
}

async function processLegacyData(extractedData: any, fieldMappings: any): Promise<any> {
  const processedData = {
    properties: [],
    valuations: [],
    comparables: [],
    orders: [],
  };

  // Process based on detected data structure
  if (Array.isArray(extractedData)) {
    // CSV-like data
    for (const record of extractedData) {
      const mappedRecord = {};
      for (const [legacyField, modernField] of Object.entries(fieldMappings)) {
        if (record[legacyField] !== undefined) {
          mappedRecord[modernField] = record[legacyField];
        }
      }

      // Determine record type and add to appropriate array
      if (mappedRecord["address"]) {
        processedData.properties.push(mappedRecord);
      }
    }
  } else if (typeof extractedData === "object") {
    // XML-like structured data
    const mappedData = {};
    for (const [legacyField, modernField] of Object.entries(fieldMappings)) {
      const value = getNestedValue(extractedData, legacyField);
      if (value !== undefined) {
        setNestedValue(mappedData, modernField, value);
      }
    }

    if (mappedData["address"]) {
      processedData.properties.push(mappedData);
    }
  }

  return processedData;
}

function getNestedValue(obj: any, path: string): any {
  return path.split(".").reduce((current, key) => current?.[key], obj);
}

function setNestedValue(obj: any, path: string, value: any): void {
  const keys = path.split(".");
  const lastKey = keys.pop();
  const target = keys.reduce((current, key) => {
    if (!current[key]) current[key] = {};
    return current[key];
  }, obj);
  target[lastKey] = value;
}

// API Routes

// Upload and extract files
router.post("/extract", upload.array("files", 10), async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    const { jobName, userId } = req.body;

    if (!files || files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    if (!jobName || !userId) {
      return res.status(400).json({ error: "Job name and user ID are required" });
    }

    // Process uploaded files
    const processedFiles = [];
    const extractedData = [];

    for (const file of files) {
      try {
        let fileData;
        const fileExtension = path.extname(file.originalname).toLowerCase();

        if (fileExtension === ".zip") {
          fileData = await extractZipFile(file.path);
          extractedData.push(...fileData);
        } else {
          const content = await fs.readFile(file.path, "utf-8");

          if (fileExtension === ".xml") {
            fileData = await parseXMLFile(content);
          } else if (fileExtension === ".csv") {
            fileData = await parseCSVFile(content);
          } else {
            fileData = { content, type: "raw" };
          }

          extractedData.push({
            filename: file.originalname,
            content: fileData,
            size: file.size,
            type: fileExtension,
          });
        }

        processedFiles.push({
          originalname: file.originalname,
          size: file.size,
          type: fileExtension,
          processed: true,
        });

        // Clean up uploaded file
        await fs.unlink(file.path);
      } catch (error) {
        console.error(`Error processing file ${file.originalname}:`, error);
        processedFiles.push({
          originalname: file.originalname,
          size: file.size,
          type: path.extname(file.originalname).toLowerCase(),
          processed: false,
          error: error.message,
        });
      }
    }

    // Detect legacy systems
    const detectedFormats = detectLegacySystem(extractedData);

    // Create import job
    const importJob = await storage.createLegacyImportJob({
      jobName,
      status: "processing",
      uploadedFiles: processedFiles,
      detectedFormats,
      extractedData,
      fieldMappings: {},
      validationErrors: [],
      previewData: [],
      importSettings: {},
      processedRecords: 0,
      totalRecords: extractedData.length,
      errorLogs: [],
      createdById: Number(userId),
    });

    res.status(200).json({
      jobId: importJob.id,
      detectedFormats,
      extractedFiles: processedFiles,
      totalRecords: extractedData.length,
      status: "extracted",
    });
  } catch (error) {
    console.error("Error in file extraction:", error);
    res.status(500).json({
      error: "Failed to extract files",
      message: error.message,
    });
  }
});

// Generate field mappings
router.post("/:jobId/map", async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const { systemType, customMappings } = req.body;

    const job = await storage.getLegacyImportJob(Number(jobId));
    if (!job) {
      return res.status(404).json({ error: "Import job not found" });
    }

    // Generate field mappings
    const fieldMappings = generateFieldMappings(job.extractedData, systemType);

    // Apply custom mappings if provided
    const finalMappings = { ...fieldMappings, ...customMappings };

    // Process the data with mappings
    const processedData = await processLegacyData(job.extractedData, finalMappings);

    // Generate preview data (first 5 records of each type)
    const previewData = {
      properties: processedData.properties.slice(0, 5),
      valuations: processedData.valuations.slice(0, 5),
      comparables: processedData.comparables.slice(0, 5),
    };

    // Update job with mappings and preview
    await storage.updateLegacyImportJob(Number(jobId), {
      status: "mapping",
      fieldMappings: finalMappings,
      previewData,
      processedRecords: Object.values(processedData).flat().length,
    });

    res.status(200).json({
      fieldMappings: finalMappings,
      previewData,
      processedRecords: Object.values(processedData).flat().length,
    });
  } catch (error) {
    console.error("Error in field mapping:", error);
    res.status(500).json({
      error: "Failed to generate field mappings",
      message: error.message,
    });
  }
});

// Preview mapped data
router.get("/:jobId/preview", async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;

    const job = await storage.getLegacyImportJob(Number(jobId));
    if (!job) {
      return res.status(404).json({ error: "Import job not found" });
    }

    res.status(200).json({
      previewData: job.previewData,
      fieldMappings: job.fieldMappings,
      totalRecords: job.totalRecords,
      status: job.status,
    });
  } catch (error) {
    console.error("Error getting preview data:", error);
    res.status(500).json({
      error: "Failed to get preview data",
      message: error.message,
    });
  }
});

// Import approved data
router.post("/:jobId/import", async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const { approved } = req.body;

    if (!approved) {
      return res.status(400).json({ error: "Import must be explicitly approved" });
    }

    const job = await storage.getLegacyImportJob(Number(jobId));
    if (!job) {
      return res.status(404).json({ error: "Import job not found" });
    }

    // Update job status
    await storage.updateLegacyImportJob(Number(jobId), {
      status: "importing",
    });

    // Process and import the data
    const processedData = await processLegacyData(job.extractedData, job.fieldMappings);
    let importedCount = 0;
    const errors = [];

    // Import properties
    for (const propertyData of processedData.properties) {
      try {
        const property = await storage.createProperty({
          ...propertyData,
          createdById: job.createdById,
        });

        // Create import record
        await storage.createLegacyImportRecord({
          jobId: Number(jobId),
          sourceSystem: job.detectedFormats[0] || "UNKNOWN",
          sourceRecordId: propertyData.id || `prop_${importedCount}`,
          recordType: "property",
          rawData: propertyData,
          mappedData: propertyData,
          importStatus: "imported",
          targetEntityId: property.id,
          targetEntityType: "properties",
        });

        importedCount++;
      } catch (error) {
        errors.push({
          type: "property",
          data: propertyData,
          error: error.message,
        });
      }
    }

    // Update job completion
    await storage.updateLegacyImportJob(Number(jobId), {
      status: "completed",
      processedRecords: importedCount,
      errorLogs: errors,
      completedAt: new Date(),
    });

    res.status(200).json({
      imported: importedCount,
      errors: errors.length,
      status: "completed",
    });
  } catch (error) {
    console.error("Error importing data:", error);

    // Update job with error status
    await storage.updateLegacyImportJob(Number(req.params.jobId), {
      status: "failed",
      errorLogs: [{ error: error.message, timestamp: new Date() }],
    });

    res.status(500).json({
      error: "Failed to import data",
      message: error.message,
    });
  }
});

// Get import jobs for a user
router.get("/jobs", async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const jobs = await storage.getLegacyImportJobsByUser(Number(userId));
    res.status(200).json(jobs);
  } catch (error) {
    console.error("Error getting import jobs:", error);
    res.status(500).json({
      error: "Failed to get import jobs",
      message: error.message,
    });
  }
});

// Get specific import job
router.get("/jobs/:jobId", async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;

    const job = await storage.getLegacyImportJob(Number(jobId));
    if (!job) {
      return res.status(404).json({ error: "Import job not found" });
    }

    // Get associated records
    const records = await storage.getLegacyImportRecordsByJob(Number(jobId));

    res.status(200).json({
      ...job,
      records,
    });
  } catch (error) {
    console.error("Error getting import job:", error);
    res.status(500).json({
      error: "Failed to get import job",
      message: error.message,
    });
  }
});

// Get legacy system templates
router.get("/templates", async (req: Request, res: Response) => {
  try {
    const templates = await storage.getAllActiveLegacySystemTemplates();
    res.status(200).json(templates);
  } catch (error) {
    console.error("Error getting legacy templates:", error);
    res.status(500).json({
      error: "Failed to get legacy templates",
      message: error.message,
    });
  }
});

// Create legacy system template
router.post("/templates", async (req: Request, res: Response) => {
  try {
    const validatedData = insertLegacySystemTemplateSchema.parse(req.body);
    const template = await storage.createLegacySystemTemplate(validatedData);
    res.status(201).json(template);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("Error creating legacy template:", error);
    res.status(500).json({
      error: "Failed to create legacy template",
      message: error.message,
    });
  }
});

export default router;
