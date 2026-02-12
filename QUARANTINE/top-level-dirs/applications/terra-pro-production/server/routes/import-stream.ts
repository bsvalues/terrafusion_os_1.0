import { Router, Request, Response } from "express";
import { rustImporter } from "../services/rust-importer-bridge";
import { schemaValidator } from "../services/schema-validator";
import { auditLogger } from "../services/audit-logger";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = Router();

// Configure multer for file uploads
const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB max file size
  },
  fileFilter: (req, file, cb) => {
    const allowedExtensions = [".db", ".sqlite", ".sqlite3", ".csv", ".xml", ".zip", ".sql"];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`File type not supported. Allowed: ${allowedExtensions.join(", ")}`));
    }
  },
});

// POST /api/import/upload - Start new import jobs (supports multiple files)
router.post("/upload", upload.array("files", 50), async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    const userId = 1; // TODO: Get from authenticated user session
    const format = req.body.format || "auto-detect";
    const jobIds: string[] = [];

    // Create import job for each file
    for (const file of files) {
      const jobId = rustImporter.createJob(userId, file.originalname, file.path, format);
      jobIds.push(jobId);
    }

    res.json({
      success: true,
      jobIds,
      totalFiles: files.length,
      message: `${files.length} import jobs created successfully`,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({
      error: "Upload failed",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// GET /api/import/stream/:jobId - Stream import results via Server-Sent Events
router.get("/stream/:jobId", (req: Request, res: Response) => {
  const jobId = req.params.jobId;
  const job = rustImporter.getJob(jobId);

  if (!job) {
    return res.status(404).json({ error: "Job not found" });
  }

  // Set up Server-Sent Events
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Cache-Control",
  });

  // Send initial job status
  res.write(
    `data: ${JSON.stringify({
      type: "job_status",
      data: job,
    })}\n\n`
  );

  // Listen for job events
  const onCompProcessed = (compJobId: string, comp: any) => {
    if (compJobId === jobId) {
      // Validate the comp data
      const validation = schemaValidator.validate(comp);

      res.write(
        `data: ${JSON.stringify({
          type: "comp_processed",
          data: {
            comp,
            validation,
          },
        })}\n\n`
      );
    }
  };

  const onJobProgress = (progressJob: any) => {
    if (progressJob.id === jobId) {
      res.write(
        `data: ${JSON.stringify({
          type: "job_progress",
          data: progressJob,
        })}\n\n`
      );
    }
  };

  const onJobCompleted = (completedJob: any) => {
    if (completedJob.id === jobId) {
      res.write(
        `data: ${JSON.stringify({
          type: "job_completed",
          data: completedJob,
        })}\n\n`
      );

      // Close the connection
      res.end();
      cleanup();
    }
  };

  const onJobStatusChanged = (changedJob: any) => {
    if (changedJob.id === jobId) {
      res.write(
        `data: ${JSON.stringify({
          type: "job_status_changed",
          data: changedJob,
        })}\n\n`
      );
    }
  };

  // Register event listeners
  rustImporter.on("compProcessed", onCompProcessed);
  rustImporter.on("jobProgress", onJobProgress);
  rustImporter.on("jobCompleted", onJobCompleted);
  rustImporter.on("jobStatusChanged", onJobStatusChanged);

  const cleanup = () => {
    rustImporter.removeListener("compProcessed", onCompProcessed);
    rustImporter.removeListener("jobProgress", onJobProgress);
    rustImporter.removeListener("jobCompleted", onJobCompleted);
    rustImporter.removeListener("jobStatusChanged", onJobStatusChanged);
  };

  // Handle client disconnect
  req.on("close", cleanup);
  req.on("aborted", cleanup);

  // Send heartbeat every 30 seconds
  const heartbeat = setInterval(() => {
    res.write(
      `data: ${JSON.stringify({
        type: "heartbeat",
        timestamp: Date.now(),
      })}\n\n`
    );
  }, 30000);

  req.on("close", () => {
    clearInterval(heartbeat);
    cleanup();
  });
});

// GET /api/import/jobs - Get all import jobs for user
router.get("/jobs", (req: Request, res: Response) => {
  const userId = 1; // TODO: Get from authenticated user session
  const jobs = rustImporter.getJobsByUser(userId);

  res.json({ jobs });
});

// GET /api/import/jobs/:jobId - Get specific job status
router.get("/jobs/:jobId", (req: Request, res: Response) => {
  const jobId = req.params.jobId;
  const job = rustImporter.getJob(jobId);

  if (!job) {
    return res.status(404).json({ error: "Job not found" });
  }

  res.json({ job });
});

// DELETE /api/import/jobs/:jobId - Cancel import job
router.delete("/jobs/:jobId", (req: Request, res: Response) => {
  const jobId = req.params.jobId;
  const cancelled = rustImporter.cancelJob(jobId);

  if (!cancelled) {
    return res.status(404).json({ error: "Job not found or cannot be cancelled" });
  }

  res.json({
    success: true,
    message: "Job cancelled successfully",
  });
});

// POST /api/import/validate - Validate TerraFusionComp data
router.post("/validate", (req: Request, res: Response) => {
  try {
    const { comp, batch } = req.body;

    if (batch && Array.isArray(batch)) {
      // Batch validation
      const results = schemaValidator.validateBatch(batch);
      const summary = schemaValidator.getValidationSummary(results);

      res.json({
        success: true,
        results,
        summary,
      });
    } else if (comp) {
      // Single comp validation
      const result = schemaValidator.validate(comp);

      res.json({
        success: true,
        result,
      });
    } else {
      res.status(400).json({
        error: 'Must provide either "comp" or "batch" data',
      });
    }
  } catch (error) {
    console.error("Validation error:", error);
    res.status(500).json({
      error: "Validation failed",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// GET /api/import/formats - Get supported import formats
router.get("/formats", (req: Request, res: Response) => {
  res.json({
    formats: [
      {
        id: "sqlite",
        name: "SQLite Database",
        extensions: [".db", ".sqlite", ".sqlite3"],
        description: "Legacy appraisal system databases",
      },
      {
        id: "csv",
        name: "CSV Files",
        extensions: [".csv"],
        description: "Comma-separated values files",
      },
      {
        id: "xml",
        name: "XML Files",
        extensions: [".xml"],
        description: "XML formatted appraisal data",
      },
      {
        id: "zip",
        name: "Archive Files",
        extensions: [".zip"],
        description: "Compressed archives containing multiple files",
      },
      {
        id: "sql",
        name: "SQL Scripts",
        extensions: [".sql"],
        description: "SQL database dumps",
      },
    ],
  });
});

// GET /api/import/audit/:jobId - Get audit trail for a job
router.get("/audit/:jobId", (req: Request, res: Response) => {
  const jobId = req.params.jobId;
  try {
    const auditReport = auditLogger.exportAuditReport(jobId);
    res.json(auditReport);
  } catch (error) {
    console.error("Audit retrieval error:", error);
    res.status(500).json({
      error: "Failed to retrieve audit trail",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// GET /api/import/audit - Get all audit logs
router.get("/audit", (req: Request, res: Response) => {
  try {
    const auditReport = auditLogger.exportAuditReport();
    res.json(auditReport);
  } catch (error) {
    console.error("Audit retrieval error:", error);
    res.status(500).json({
      error: "Failed to retrieve audit trails",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// POST /api/import/validate/rag - RAG-based LLM validation and correction
router.post("/validate/rag", async (req: Request, res: Response) => {
  try {
    const { comp } = req.body;

    if (!comp) {
      return res.status(400).json({ error: "Property record required" });
    }

    const { llmRAGValidator } = await import("../services/llm-rag-validator");
    const correctionResult = await llmRAGValidator.correctWithRAG(comp);

    res.json(correctionResult);
  } catch (error) {
    console.error("RAG validation error:", error);
    res.status(500).json({
      error: "Failed to validate with RAG",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// GET /api/audit/export - Export audit logs in multiple formats
router.get("/export", async (req: Request, res: Response) => {
  try {
    const format = (req.query.format as string) || "json";
    const jobId = req.query.jobId as string;

    const auditReport = auditLogger.exportAuditReport(jobId);

    switch (format.toLowerCase()) {
      case "json":
        res.setHeader("Content-Type", "application/json");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="terrafusion-audit-${Date.now()}.json"`
        );
        res.json(auditReport);
        break;

      case "csv":
        const { Parser } = await import("json2csv");
        const fields = ["id", "jobId", "compHash", "merkleRoot", "blockchainTxId", "createdAt"];
        const parser = new Parser({ fields });
        const csv = parser.parse(auditReport.logs);

        res.setHeader("Content-Type", "text/csv");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="terrafusion-audit-${Date.now()}.csv"`
        );
        res.send(csv);
        break;

      case "pdf":
        const PDFDocument = (await import("pdfkit")).default;
        const doc = new PDFDocument();

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="terrafusion-audit-${Date.now()}.pdf"`
        );

        doc.pipe(res);

        // PDF Header
        doc.fontSize(20).text("Terrafusion Audit Report", { align: "center" });
        doc.moveDown();

        // Summary
        doc.fontSize(14).text("Summary:", { underline: true });
        doc
          .fontSize(12)
          .text(`Total Jobs: ${auditReport.summary.totalJobs}`)
          .text(`Total Records: ${auditReport.summary.totalRecords}`)
          .text(`Blockchain Transactions: ${auditReport.summary.blockchainTransactions}`)
          .text(`Generated: ${new Date().toISOString()}`);

        doc.moveDown();

        // Audit Entries
        doc.fontSize(14).text("Audit Entries:", { underline: true });
        doc.fontSize(10);

        auditReport.logs.forEach((entry /* , index */) => {
          if (index > 0 && index % 25 === 0) {
            doc.addPage();
          }

          doc.text(`${index + 1}. Job: ${entry.jobId}`);
          doc.text(`   Hash: ${entry.compHash}`);
          doc.text(`   Merkle Root: ${entry.merkleRoot || "Pending"}`);
          doc.text(`   Blockchain TX: ${entry.blockchainTxId || "Pending"}`);
          doc.text(`   Created: ${entry.createdAt}`);
          doc.moveDown(0.5);
        });

        doc.end();
        break;

      default:
        res.status(400).json({ error: "Unsupported format. Use json, csv, or pdf." });
    }
  } catch (error) {
    console.error("Export error:", error);
    res.status(500).json({
      error: "Failed to export audit data",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
