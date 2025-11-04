/**
 * Export Controller
 *
 * Handles PDF and ZIP export requests for property data,
 * appraisal reports, and comparable properties.
 */

import { Request, Response } from "express";
import * as fs from "fs";
import * as path from "path";
import pdfBatchExporter from "../lib/exporters/pdf-batch-exporter";
import { IStorage } from "../storage";
import config from "../../shared/config.js";

export class ExportController {
  constructor(private storage: IStorage) {}

  /**
   * Export a comparable property as PDF
   */
  public async exportComparablePDF(req: Request, res: Response): Promise<void> {
    try {
      const { comparableId } = req.params;
      const options = req.body || {};

      // Validate request
      if (!comparableId) {
        res.status(400).json({ error: "Comparable ID is required" });
        return;
      }

      // Get comparable data
      let comparable;

      if (config.demoMode) {
        // Demo mode: use placeholder comparable data
        comparable = {
          id: comparableId,
          address: "123 Sample Street",
          city: "Example City",
          state: "CA",
          zipCode: "90210",
          salePrice: "850000",
          saleDate: "2025-01-15",
          propertyType: "Single Family",
          yearBuilt: 2005,
          grossLivingArea: "2250",
          bedrooms: "4",
          bathrooms: "2.5",
          adjustments: [
            {
              id: "adj1",
              comparableId: comparableId,
              adjustmentType: "Location",
              amount: "15000",
              description: "Superior location adjustment",
            },
            {
              id: "adj2",
              comparableId: comparableId,
              adjustmentType: "GLA",
              amount: "-8500",
              description: "Size adjustment - smaller than subject",
            },
          ],
        };
      } else {
        // Real mode: fetch from storage
        comparable = await this.storage.getComparableById(comparableId);

        if (!comparable) {
          res.status(404).json({ error: "Comparable not found" });
          return;
        }
      }

      // Generate PDF
      const pdfPath = await pdfBatchExporter.exportComparablePDF(comparable, options);

      // Set headers for file download
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=${path.basename(pdfPath)}`);

      // Stream the file to the client
      const fileStream = fs.createReadStream(pdfPath);
      fileStream.pipe(res);

      // Clean up the file after sending
      fileStream.on("end", () => {
        fs.unlinkSync(pdfPath);
      });
    } catch (error) {
      console.error("Error exporting comparable as PDF:", error);
      res.status(500).json({ error: "Failed to export PDF" });
    }
  }

  /**
   * Export multiple comparables as a ZIP archive
   */
  public async exportComparablesZIP(req: Request, res: Response): Promise<void> {
    try {
      const { appraisalId } = req.params;
      const { comparableIds = [], ...options } = req.body || {};

      // Validate request
      if (!appraisalId) {
        res.status(400).json({ error: "Appraisal ID is required" });
        return;
      }

      // Get comparables data
      let comparables = [];

      if (config.demoMode) {
        // Demo mode: use placeholder comparable data
        comparables = comparableIds.map((id /* , index */) => ({
          id,
          address: `${123 + index} Sample Street`,
          city: "Example City",
          state: "CA",
          zipCode: "90210",
          salePrice: String(800000 + index * 25000),
          saleDate: `2025-0${1 + (index % 9)}-${10 + (index % 15)}`,
          propertyType: "Single Family",
          yearBuilt: 2000 + index * 3,
          grossLivingArea: String(2000 + index * 100),
          bedrooms: String(3 + (index % 3)),
          bathrooms: String(2 + (index % 2)),
          adjustments: [
            {
              id: `adj_${id}_1`,
              comparableId: id,
              adjustmentType: "Location",
              amount: String(10000 + index * 1000),
              description: "Location adjustment",
            },
            {
              id: `adj_${id}_2`,
              comparableId: id,
              adjustmentType: "Condition",
              amount: String(-5000 - index * 500),
              description: "Condition adjustment",
            },
          ],
        }));
      } else {
        // Real mode: fetch from storage
        if (comparableIds.length > 0) {
          // Fetch specific comparables if IDs are provided
          comparables = await Promise.all(
            comparableIds.map((id) => this.storage.getComparableById(id))
          );
          comparables = comparables.filter(Boolean); // Remove any nulls
        } else {
          // Fetch all comparables for the appraisal
          comparables = await this.storage.getComparablesByAppraisalId(appraisalId);
        }

        if (!comparables || comparables.length === 0) {
          res.status(404).json({ error: "No comparables found" });
          return;
        }
      }

      // Generate ZIP
      const zipPath = await pdfBatchExporter.exportComparablesZIP(
        comparables,
        appraisalId,
        options
      );

      // Set headers for file download
      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", `attachment; filename=${path.basename(zipPath)}`);

      // Stream the file to the client
      const fileStream = fs.createReadStream(zipPath);
      fileStream.pipe(res);

      // Clean up the file after sending
      fileStream.on("end", () => {
        fs.unlinkSync(zipPath);
      });
    } catch (error) {
      console.error("Error exporting comparables as ZIP:", error);
      res.status(500).json({ error: "Failed to export ZIP" });
    }
  }

  /**
   * Apply batch adjustments to multiple comparables
   */
  public async applyBatchAdjustments(req: Request, res: Response): Promise<void> {
    try {
      const { appraisalId } = req.params;
      const { comparables, adjustments } = req.body || {};

      // Validate request
      if (!appraisalId) {
        res.status(400).json({ error: "Appraisal ID is required" });
        return;
      }

      if (!adjustments || !Array.isArray(adjustments) || adjustments.length === 0) {
        res.status(400).json({ error: "Adjustments data is required" });
        return;
      }

      // In a real implementation, we would update the comparables in storage
      if (!config.demoMode) {
        // Process each comparable and save its adjustments
        for (const comparable of comparables) {
          if (!comparable.adjustments) {
            continue;
          }

          // Save the new adjustments for this comparable
          await this.storage.updateComparable(comparable.id, comparable);
        }
      }

      res.status(200).json({
        success: true,
        message: "Batch adjustments applied successfully",
        comparablesUpdated: comparables.length,
      });
    } catch (error) {
      console.error("Error applying batch adjustments:", error);
      res.status(500).json({ error: "Failed to apply batch adjustments" });
    }
  }
}

export default ExportController;
