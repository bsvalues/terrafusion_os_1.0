import { Router } from "express";
import { db } from "../db";
import { appraisalForms, properties, orders } from "../../shared/schema";
import { eq, and } from "drizzle-orm";

const router = Router();

// Save URAR form data
router.post("/urar/save", async (req, res) => {
  try {
    const { propertyId, formData } = req.body;

    if (!propertyId || !formData) {
      return res.status(400).json({ error: "Property ID and form data are required" });
    }

    // Calculate completion percentage
    const requiredFields = [
      formData.subjectProperty?.address,
      formData.subjectProperty?.city,
      formData.subjectProperty?.state,
      formData.subjectProperty?.zipCode,
      formData.subjectProperty?.county,
    ].filter(Boolean);

    const completionPercentage = Math.round((requiredFields.length / 5) * 100);

    // Check if form already exists
    const existingForm = await db
      .select()
      .from(appraisalForms)
      .where(and(eq(appraisalForms.propertyId, propertyId), eq(appraisalForms.formType, "urar")))
      .limit(1);

    if (existingForm.length > 0) {
      // Update existing form
      const updated = await db
        .update(appraisalForms)
        .set({
          formData,
          completionPercentage,
          lastSavedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(appraisalForms.id, existingForm[0].id))
        .returning();

      res.json({ success: true, form: updated[0] });
    } else {
      // Create new form - need to find or create order first
      let orderId = 1; // Default for demo

      try {
        // Try to find an existing order for this property
        const existingOrder = await db
          .select()
          .from(orders)
          .where(eq(orders.propertyId, propertyId))
          .limit(1);

        if (existingOrder.length > 0) {
          orderId = existingOrder[0].id;
        }
      } catch (error) {
        console.log("Using default order ID for demo");
      }

      const newForm = await db
        .insert(appraisalForms)
        .values({
          orderId,
          propertyId,
          formType: "urar",
          formData,
          completionPercentage,
          createdById: 1, // Default user for demo
        })
        .returning();

      res.json({ success: true, form: newForm[0] });
    }
  } catch (error) {
    console.error("Form save error:", error);
    res.status(500).json({ error: "Failed to save form" });
  }
});

// Get URAR form data
router.get("/urar/:propertyId", async (req, res) => {
  try {
    const { propertyId } = req.params;

    const form = await db
      .select()
      .from(appraisalForms)
      .where(
        and(
          eq(appraisalForms.propertyId, parseInt(propertyId)),
          eq(appraisalForms.formType, "urar")
        )
      )
      .limit(1);

    if (form.length === 0) {
      return res.status(404).json({ error: "Form not found" });
    }

    res.json(form[0]);
  } catch (error) {
    console.error("Form fetch error:", error);
    res.status(500).json({ error: "Failed to fetch form" });
  }
});

export default router;
