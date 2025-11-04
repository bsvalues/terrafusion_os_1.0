import { Router, Request, Response } from "express";
import { storage } from "../storage";
import { insertRealEstateTermSchema, RealEstateTerm } from "@shared/schema";
import { z } from "zod";
import OpenAI from "openai";

// Initialize OpenAI if API key is available
let openai: OpenAI | null = null;
if (process.env.OPENAI_API_KEY) {
  // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

const tooltipRoutes = Router();

// Get all real estate terms
tooltipRoutes.get("/terms", async (req: Request, res: Response) => {
  try {
    const terms = await storage.getAllRealEstateTerms();
    res.json(terms);
  } catch (error) {
    console.error("Error getting real estate terms:", error);
    res.status(500).json({ error: "Failed to get real estate terms" });
  }
});

// Get a specific real estate term by ID
tooltipRoutes.get("/terms/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const term = await storage.getRealEstateTerm(id);

    if (!term) {
      return res.status(404).json({ error: "Term not found" });
    }

    res.json(term);
  } catch (error) {
    console.error("Error getting real estate term:", error);
    res.status(500).json({ error: "Failed to get real estate term" });
  }
});

// Get a real estate term by name
tooltipRoutes.get("/terms/name/:term", async (req: Request, res: Response) => {
  try {
    const termName = req.params.term;
    const term = await storage.getRealEstateTermByName(termName);

    if (!term) {
      return res.status(404).json({ error: "Term not found" });
    }

    res.json(term);
  } catch (error) {
    console.error("Error getting real estate term by name:", error);
    res.status(500).json({ error: "Failed to get real estate term by name" });
  }
});

// Get terms by category
tooltipRoutes.get("/terms/category/:category", async (req: Request, res: Response) => {
  try {
    const category = req.params.category;
    const terms = await storage.getRealEstateTermsByCategory(category);
    res.json(terms);
  } catch (error) {
    console.error("Error getting terms by category:", error);
    res.status(500).json({ error: "Failed to get terms by category" });
  }
});

// Search terms
tooltipRoutes.get("/terms/search/:query", async (req: Request, res: Response) => {
  try {
    const query = req.params.query;
    const terms = await storage.searchRealEstateTerms(query);
    res.json(terms);
  } catch (error) {
    console.error("Error searching terms:", error);
    res.status(500).json({ error: "Failed to search terms" });
  }
});

// Create a new real estate term
tooltipRoutes.post("/terms", async (req: Request, res: Response) => {
  try {
    const validationResult = insertRealEstateTermSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Invalid term data",
        details: validationResult.error.format(),
      });
    }

    const term = await storage.createRealEstateTerm(validationResult.data);
    res.status(201).json(term);
  } catch (error) {
    console.error("Error creating real estate term:", error);
    res.status(500).json({ error: "Failed to create real estate term" });
  }
});

// Update a real estate term
tooltipRoutes.put("/terms/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const validationResult = insertRealEstateTermSchema.partial().safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Invalid term data",
        details: validationResult.error.format(),
      });
    }

    const updatedTerm = await storage.updateRealEstateTerm(id, validationResult.data);

    if (!updatedTerm) {
      return res.status(404).json({ error: "Term not found" });
    }

    res.json(updatedTerm);
  } catch (error) {
    console.error("Error updating real estate term:", error);
    res.status(500).json({ error: "Failed to update real estate term" });
  }
});

// Delete a real estate term
tooltipRoutes.delete("/terms/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const success = await storage.deleteRealEstateTerm(id);

    if (!success) {
      return res.status(404).json({ error: "Term not found" });
    }

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting real estate term:", error);
    res.status(500).json({ error: "Failed to delete real estate term" });
  }
});

// Get related terms
tooltipRoutes.get("/terms/:id/related", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const relatedTerms = await storage.getRelatedTerms(id);
    res.json(relatedTerms);
  } catch (error) {
    console.error("Error getting related terms:", error);
    res.status(500).json({ error: "Failed to get related terms" });
  }
});

// Get AI enhanced explanation for a term
tooltipRoutes.post("/explain", async (req: Request, res: Response) => {
  try {
    const { term, context } = req.body;

    if (!term) {
      return res.status(400).json({ error: "Term is required" });
    }

    // First try to get explanation from our database
    const explanation = await storage.getTermExplanation(term, context);

    if (explanation) {
      return res.json(explanation);
    }

    // If term not found in database and OpenAI API is available, try to generate explanation
    if (openai && context) {
      try {
        const prompt = `
I need a professional explanation of the real estate term "${term}" in the context of: "${context}".

Please provide the following in JSON format:
{
  "definition": "A brief, clear definition (25 words or less)",
  "contextualExplanation": "A more detailed explanation (2-3 sentences) specifically in the context provided",
  "examples": ["1-2 examples of how this term is used in practice"],
  "relatedTerms": ["2-3 closely related real estate terms"]
}
`;

        const response = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
        });

        const aiExplanation = JSON.parse(response.choices[0].message.content);
        return res.json(aiExplanation);
      } catch (aiError) {
        console.error("Error generating AI explanation:", aiError);
        return res.status(500).json({ error: "Failed to generate AI explanation" });
      }
    }

    // If we can't find or generate an explanation, return 404
    return res.status(404).json({ error: "Term not found and no AI explanation available" });
  } catch (error) {
    console.error("Error explaining term:", error);
    res.status(500).json({ error: "Failed to explain term" });
  }
});

export { tooltipRoutes };
