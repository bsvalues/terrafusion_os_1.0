/**
 * Terrafusion Universal Conversion Agent Routes
 * API endpoints for data conversion services
 */

import { Router } from "express";
import multer from "multer";
import { spawn } from "child_process";
import path from "path";
import { promises as fs } from "fs";
import { storage } from "../storage";

const router = Router();
const upload = multer({ dest: "uploads/" });

class UniversalConversionAgent {
  private rustAgentPath: string;
  private templatesPath: string;
  private dataPath: string;

  constructor() {
    this.rustAgentPath = path.join(process.cwd(), "rust_agent");
    this.templatesPath = path.join(this.rustAgentPath, "templates");
    this.dataPath = path.join(this.rustAgentPath, "data");
  }

  async convertData(templateName: string, inputFile: string, outputFile?: string) {
    return new Promise((resolve, reject) => {
      const templatePath = path.join(this.templatesPath, templateName);
      const args = ["--template", templatePath, "--input", inputFile];

      if (outputFile) {
        args.push("--output", outputFile);
      }

      const rustProcess = spawn("./target/release/universal_conversion_agent", args, {
        cwd: this.rustAgentPath,
        stdio: ["pipe", "pipe", "pipe"],
      });

      let stdout = "";
      let stderr = "";

      rustProcess.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      rustProcess.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      rustProcess.on("close", (code) => {
        if (code === 0) {
          try {
            const result = outputFile
              ? { success: true, outputFile, message: "Data converted successfully" }
              : { success: true, data: JSON.parse(stdout) };
            resolve(result);
          } catch (error) {
            reject(new Error(`Failed to parse output: ${(error as Error).message}`));
          }
        } else {
          reject(new Error(`Conversion failed: ${stderr || "Unknown error"}`));
        }
      });

      rustProcess.on("error", (error) => {
        reject(new Error(`Failed to start conversion agent: ${error.message}`));
      });
    });
  }

  async processPropertyData(csvData: any[], templateName = "sample_template.xml") {
    try {
      // Write CSV data to temporary file
      const tempCsvPath = path.join(this.dataPath, `temp_${Date.now()}.csv`);
      const csvContent = this.arrayToCsv(csvData);
      await fs.writeFile(tempCsvPath, csvContent, "utf8");

      // Convert using Rust agent
      const result = await this.convertData(templateName, tempCsvPath);

      // Clean up temporary file
      await fs.unlink(tempCsvPath).catch(() => {});

      return {
        success: true,
        originalRecords: csvData.length,
        processedData: result.data,
        template: templateName,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  arrayToCsv(data: any[]): string {
    if (!data || data.length === 0) return "";

    if (Array.isArray(data[0])) {
      // Array of arrays
      return data.map((row) => row.join(",")).join("\n");
    } else {
      // Array of objects
      const headers = Object.keys(data[0]);
      const csvRows = [headers.join(",")];

      data.forEach((row) => {
        const values = headers.map((header) => {
          const value = row[header] || "";
          return typeof value === "string" && value.includes(",") ? `"${value}"` : value;
        });
        csvRows.push(values.join(","));
      });

      return csvRows.join("\n");
    }
  }

  async isReady(): Promise<boolean> {
    try {
      const agentPath = path.join(
        this.rustAgentPath,
        "target",
        "release",
        "universal_conversion_agent"
      );
      await fs.access(agentPath);
      return true;
    } catch {
      return false;
    }
  }
}

const conversionAgent = new UniversalConversionAgent();

// Health check endpoint
router.get("/conversion/health", async (req, res) => {
  try {
    const isReady = await conversionAgent.isReady();
    res.json({
      status: "ok",
      service: "Universal Conversion Agent",
      rustAgentReady: isReady,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: (error as Error).message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Convert property data for Terrafusion format
router.post("/conversion/property", async (req, res) => {
  try {
    const { properties, templateName } = req.body;

    if (!properties || !Array.isArray(properties)) {
      return res.status(400).json({
        success: false,
        error: "Properties array is required",
      });
    }

    // Convert property objects to CSV format for processing
    const csvData = properties.map((prop) => [
      prop.address || "",
      prop.price || 0,
      prop.sqft || 0,
      prop.bedrooms || 0,
    ]);

    const result = await conversionAgent.processPropertyData(
      csvData,
      templateName || "sample_template.xml"
    );

    res.json({
      ...result,
      terrafusionFormat: true,
      inputProperties: properties.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Convert CSV file upload
router.post("/conversion/convert", upload.single("csvFile"), async (req, res) => {
  try {
    const { templateName, csvData } = req.body;
    let dataToProcess;

    if (req.file) {
      // File upload - read CSV from uploaded file
      const csvContent = await fs.readFile(req.file.path, "utf8");
      // Parse CSV content into array format
      const lines = csvContent.split("\n").filter((line) => line.trim());
      dataToProcess = lines.map((line) => line.split(","));
    } else if (csvData) {
      // JSON data provided
      dataToProcess = Array.isArray(csvData) ? csvData : [csvData];
    } else {
      return res.status(400).json({
        success: false,
        error: "No CSV file or data provided",
      });
    }

    const result = await conversionAgent.processPropertyData(
      dataToProcess,
      templateName || "sample_template.xml"
    );

    // Clean up uploaded file
    if (req.file) {
      await fs.unlink(req.file.path).catch(() => {});
    }

    // Track conversion history
    try {
      const historyEntry = {
        templateName: templateName || "default_template",
        inputFileName: req.file?.filename || "inline_data",
        outputFileName: `converted_${Date.now()}.json`,
        inputRecords: dataToProcess.length,
        outputRecords: (result as any)?.processedData?.length || 0,
        status: (result as any)?.success ? "completed" : "failed",
        agentSummary: `Processed ${dataToProcess.length} records using ${templateName || "default"} template. ${(result as any)?.success ? "Conversion completed successfully." : "Conversion encountered errors."}`,
        warnings: (result as any)?.error ? [(result as any).error] : undefined,
      };

      await storage.createConversionHistory(historyEntry);
    } catch (historyError) {
      console.warn("Failed to save conversion history:", historyError);
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Get conversion history
router.get("/conversion/history", async (req, res) => {
  try {
    const history = await storage.getAllConversionHistory();
    res.json(
      history.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    );
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Get available conversion templates
router.get("/conversion/templates", async (req, res) => {
  try {
    const templates = await storage.getAllConversionTemplates();

    // If no templates in database, return some defaults
    if (templates.length === 0) {
      const defaultTemplates = [
        {
          id: 1,
          name: "Property Import Template",
          description: "Standard template for importing property data from MLS systems",
          fieldMappings: {
            Address: "address",
            Price: "price",
            SqFt: "squareFootage",
            Bedrooms: "bedrooms",
            Bathrooms: "bathrooms",
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 2,
          name: "Comparable Sales Template",
          description: "Template for processing comparable sales data",
          fieldMappings: {
            Sale_Date: "saleDate",
            Sale_Price: "salePrice",
            Property_Address: "address",
            Living_Area: "grossLivingArea",
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      return res.json(defaultTemplates);
    }

    res.json(templates);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Create new conversion template
router.post("/conversion/templates", async (req, res) => {
  try {
    const { name, description, fieldMappings } = req.body;

    if (!name || !fieldMappings) {
      return res.status(400).json({
        success: false,
        error: "Template name and field mappings are required",
      });
    }

    const template = await storage.createConversionTemplate({
      name,
      description: description || "",
      fieldMappings: JSON.stringify(fieldMappings),
      isActive: true,
    });

    res.json({
      success: true,
      template,
      message: "Template created successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message,
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
