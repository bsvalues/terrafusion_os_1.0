import express from "express";
import { upload } from "../utils/file-upload";
import {
  createOrder,
  getOrders,
  getOrderById,
  updateOrder,
  updateOrderStatus,
  deleteOrder,
  createPaymentIntent,
} from "../controllers/order-controller";

const router = express.Router();

// Order management endpoints
router.post("/", upload.single("attachment"), createOrder);
router.get("/", getOrders);
router.get("/:id", getOrderById);
router.put("/:id", upload.single("attachment"), updateOrder);
router.patch("/:id/status", updateOrderStatus);
router.delete("/:id", deleteOrder);

// Payment processing endpoint
router.post("/payment-intent", createPaymentIntent);

export default router;
