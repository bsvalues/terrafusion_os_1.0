import { WebSocket } from "ws";

// Store connected clients with their information
const clients = new Map<WebSocket, { id: string; userId?: number; interests?: string[] }>();

// Connect a new client to the service
export function connectClient(
  socket: WebSocket,
  id: string,
  userId?: number,
  interests?: string[]
) {
  clients.set(socket, { id, userId, interests });
  console.log(`[ReviewerWS] Client connected: ${id}, total clients: ${clients.size}`);
}

// Disconnect a client from the service
export function disconnectClient(socket: WebSocket) {
  const client = clients.get(socket);
  if (client) {
    console.log(
      `[ReviewerWS] Client disconnected: ${client.id}, total clients: ${clients.size - 1}`
    );
    clients.delete(socket);
  }
}

// Send a message to a specific client
export function sendToClient(socket: WebSocket, data: any) {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(data));
  }
}

// Send a message to all connected clients
export function broadcastToAll(data: any) {
  for (const [socket, _] of clients) {
    sendToClient(socket, data);
  }
}

// Send a message to clients interested in specific topics
export function broadcastToInterested(data: any, topic: string) {
  for (const [socket, client] of clients) {
    if (client.interests && client.interests.includes(topic)) {
      sendToClient(socket, data);
    }
  }
}

// Notify clients about a new review request
export function notifyNewReviewRequest(reviewRequest: any) {
  broadcastToAll({
    type: "new_review_request",
    data: reviewRequest,
  });
}

// Notify clients about an updated review request
export function notifyUpdatedReviewRequest(reviewRequest: any) {
  broadcastToAll({
    type: "updated_review_request",
    data: reviewRequest,
  });
}

// Notify clients about a new comment
export function notifyNewComment(comment: any) {
  broadcastToInterested(
    {
      type: "new_comment",
      data: comment,
    },
    `object_${comment.objectType}_${comment.objectId}`
  );
}

// Notify clients about a new annotation
export function notifyNewAnnotation(annotation: any) {
  broadcastToInterested(
    {
      type: "new_annotation",
      data: annotation,
    },
    `object_${annotation.objectType}_${annotation.objectId}`
  );
}

// Notify clients about a new revision history entry
export function notifyNewRevision(revision: any) {
  broadcastToInterested(
    {
      type: "new_revision",
      data: revision,
    },
    `object_${revision.objectType}_${revision.objectId}`
  );
}

// Get connection statistics
export function getConnectionStats() {
  return {
    totalConnections: clients.size,
    clients: Array.from(clients.entries()).map(([_, client]) => ({
      id: client.id,
      userId: client.userId,
      interests: client.interests,
    })),
  };
}
