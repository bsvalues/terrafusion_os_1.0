/**
 * Export Routes
 *
 * Routes for PDF and ZIP export functionality.
 */

import { Router } from "express";
import ExportController from "../controllers/export-controller";
import { IStorage } from "../storage";

export function registerExportRoutes(router: Router, storage: IStorage): void {
  const exportController = new ExportController(storage);

  // Export a single comparable as PDF
  router.post("/comparables/:comparableId/export-pdf", (req, res) =>
    exportController.exportComparablePDF(req, res)
  );

  // Export multiple comparables as a ZIP archive
  router.post("/appraisals/:appraisalId/export-zip", (req, res) =>
    exportController.exportComparablesZIP(req, res)
  );

  // Apply batch adjustments to multiple comparables
  router.post("/appraisals/:appraisalId/comparables/batch-adjust", (req, res) =>
    exportController.applyBatchAdjustments(req, res)
  );
}
