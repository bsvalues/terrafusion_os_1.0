/**
 * CORS Middleware
 *
 * This middleware enables Cross-Origin Resource Sharing (CORS) to allow
 * API requests from different origins, including both browser-based tools
 * and our Node.js test scripts.
 */

export default function corsMiddleware(req, res, next) {
  // Set CORS headers
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Continue to the next middleware
  next();
}
