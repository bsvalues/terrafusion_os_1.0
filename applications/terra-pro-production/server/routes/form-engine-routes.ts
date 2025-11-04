/**
 * Terrafusion Form Engine API Routes
 * Complete form-first architecture with agent validation
 */

import { Router } from "express";
import { FormEngine } from "../lib/form-engine/core";
import { LedgerService } from "../lib/ledger/service";

const router = Router();
const formEngine = new FormEngine();
const ledgerService = new LedgerService();

// Initialize Form Engine with event handlers
formEngine.on("formCreated", (form) => {
  console.log(`[Form Engine] Form created: ${form.id}`);
});

formEngine.on("fieldUpdated", (update) => {
  console.log(`[Form Engine] Field updated: ${update.fieldId} in form ${update.formId}`);
});

formEngine.on("validationUpdate", (result) => {
  console.log(
    `[Form Engine] Validation: ${result.fieldId} - ${result.valid ? "valid" : "invalid"}`
  );
});

formEngine.on("formSubmitted", async (form) => {
  console.log(`[Form Engine] Form submitted: ${form.id}`);

  // Record in ledger
  try {
    await ledgerService.recordAppraisal(form, {
      templateId: form.templateId,
      propertyAddress: form.data.property_address,
      appraiserId: "system", // Would come from auth
      reportType: "urar",
    });
  } catch (error) {
    console.error("[Form Engine] Ledger recording failed:", error);
  }
});

// Get all available form templates
router.get("/templates", (req, res) => {
  try {
    const templates = formEngine.getAllTemplates();
    res.json({ templates });
  } catch (error) {
    console.error("Templates error:", error);
    res.status(500).json({ error: "Failed to get templates" });
  }
});

// Get specific template
router.get("/templates/:templateId", (req, res) => {
  try {
    const { templateId } = req.params;
    const template = formEngine.getTemplate(templateId);

    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }

    res.json({ template });
  } catch (error) {
    console.error("Template error:", error);
    res.status(500).json({ error: "Failed to get template" });
  }
});

// Create new form instance
router.post("/forms", (req, res) => {
  try {
    const { templateId, initialData } = req.body;

    if (!templateId) {
      return res.status(400).json({ error: "Template ID is required" });
    }

    const form = formEngine.createForm(templateId, initialData);
    res.json({ form });
  } catch (error) {
    console.error("Form creation error:", error);
    res.status(500).json({ error: "Failed to create form" });
  }
});

// Get form instance
router.get("/forms/:formId", (req, res) => {
  try {
    const { formId } = req.params;
    const form = formEngine.getForm(formId);

    if (!form) {
      return res.status(404).json({ error: "Form not found" });
    }

    res.json({ form });
  } catch (error) {
    console.error("Form retrieval error:", error);
    res.status(500).json({ error: "Failed to get form" });
  }
});

// Update form field
router.put("/forms/:formId/fields/:fieldId", (req, res) => {
  try {
    const { formId, fieldId } = req.params;
    const { value } = req.body;

    formEngine.updateField(formId, fieldId, value);

    const form = formEngine.getForm(formId);
    res.json({
      success: true,
      form,
      fieldId,
      value,
    });
  } catch (error) {
    console.error("Field update error:", error);
    res.status(500).json({ error: "Failed to update field" });
  }
});

// Submit form for final processing
router.post("/forms/:formId/submit", async (req, res) => {
  try {
    const { formId } = req.params;

    const result = await formEngine.submitForm(formId);
    const form = formEngine.getForm(formId);

    res.json({
      success: true,
      hash: result.hash,
      signature: result.signature,
      form,
    });
  } catch (error) {
    console.error("Form submission error:", error);
    res.status(500).json({ error: "Failed to submit form" });
  }
});

// Get form validation status
router.get("/forms/:formId/validation", (req, res) => {
  try {
    const { formId } = req.params;
    const form = formEngine.getForm(formId);

    if (!form) {
      return res.status(404).json({ error: "Form not found" });
    }

    res.json({
      formId,
      validationResults: form.validationResults,
      agentFeedback: form.agentFeedback,
      status: form.status,
    });
  } catch (error) {
    console.error("Validation status error:", error);
    res.status(500).json({ error: "Failed to get validation status" });
  }
});

// Generate form export bundle
router.get("/forms/:formId/export", async (req, res) => {
  try {
    const { formId } = req.params;
    const { format = "tfp" } = req.query;

    const form = formEngine.getForm(formId);
    if (!form) {
      return res.status(404).json({ error: "Form not found" });
    }

    // Generate ledger proof bundle
    const proofBundle = await ledgerService.generateProofBundle(formId);

    const exportData = {
      version: "1.0",
      format: "Terrafusion-Package",
      form: {
        id: form.id,
        templateId: form.templateId,
        data: form.data,
        status: form.status,
        hash: form.hash,
        signature: form.signature,
        createdAt: form.createdAt,
        submittedAt: form.updatedAt,
      },
      validation: {
        results: form.validationResults,
        agentFeedback: form.agentFeedback,
      },
      ledger: proofBundle.exportData,
      metadata: {
        exportedAt: new Date().toISOString(),
        exportFormat: format,
        system: "Terrafusion-AI-ICSF",
      },
    };

    if (format === "json") {
      res.json(exportData);
    } else {
      // TFP format (Terrafusion Package)
      res.setHeader("Content-Type", "application/octet-stream");
      res.setHeader("Content-Disposition", `attachment; filename="form-${formId}.tfp"`);
      res.send(JSON.stringify(exportData, null, 2));
    }
  } catch (error) {
    console.error("Export error:", error);
    res.status(500).json({ error: "Failed to export form" });
  }
});

// Verify form hash
router.post("/verify", async (req, res) => {
  try {
    const { hash } = req.body;

    if (!hash) {
      return res.status(400).json({ error: "Hash is required" });
    }

    const proof = await ledgerService.verifyAppraisal(hash);
    res.json({ proof });
  } catch (error) {
    console.error("Verification error:", error);
    res.status(500).json({ error: "Failed to verify hash" });
  }
});

// Get ledger statistics
router.get("/ledger/stats", (req, res) => {
  try {
    const stats = ledgerService.getStats();
    res.json({ stats });
  } catch (error) {
    console.error("Ledger stats error:", error);
    res.status(500).json({ error: "Failed to get ledger stats" });
  }
});

export default router;
