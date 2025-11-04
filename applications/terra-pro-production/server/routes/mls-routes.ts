/**
 * MLS Routes
 * Handles API endpoints for MLS integration
 */
import { Router } from "express";
import * as mlsController from "../controllers/mls-controller";

const router = Router();

// MLS Systems
router.get("/systems", mlsController.getMlsSystems);
router.get("/systems/:id", mlsController.getMlsSystem);
router.post("/systems", mlsController.createMlsSystem);
router.put("/systems/:id", mlsController.updateMlsSystem);
router.delete("/systems/:id", mlsController.deleteMlsSystem);
router.post("/systems/:id/test-connection", mlsController.testMlsConnection);

// MLS Property Search and Import
router.post("/systems/:systemId/search", mlsController.searchMlsProperties);
router.post("/systems/:systemId/import", mlsController.importMlsProperty);

// MLS Field Mappings
router.get("/systems/:systemId/mappings", mlsController.getFieldMappings);
router.post("/mappings", mlsController.createFieldMapping);
router.put("/mappings/:id", mlsController.updateFieldMapping);
router.delete("/mappings/:id", mlsController.deleteFieldMapping);

export default router;
