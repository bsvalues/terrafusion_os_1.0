import express from "express";

// WebSocket router to ensure WebSocket endpoints are handled correctly
const websocketRouter = express.Router();

// Create special routes that will handle WebSocket connections
// These routes don't actually do anything in the Express layer
// They just make sure the paths exist so Vite doesn't intercept them
websocketRouter.get("/ws", (req, res) => {
  // This route will never be called for WebSocket connections
  // But it ensures Express knows about the path
  res.status(400).send("WebSocket endpoint - HTTP GET not supported");
});

websocketRouter.get("/ws-alt", (req, res) => {
  // This route will never be called for WebSocket connections
  // But it ensures Express knows about the path
  res.status(400).send("Alternative WebSocket endpoint - HTTP GET not supported");
});

export default websocketRouter;
