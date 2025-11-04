// Simple HTTP server to view the stardust property page
import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create HTTP server
const server = http.createServer((req, res) => {
  // Set default response headers
  res.setHeader("Content-Type", "text/html");

  // Always serve stardust.html
  const filePath = path.join(__dirname, "stardust.html");

  fs.readFile(filePath, (err, content) => {
    if (err) {
      // Handle errors
      console.error(`Error reading file: ${err.message}`);
      res.writeHead(500);
      res.end(`Error: ${err.message}`);
      return;
    }

    // Successfully read the file
    res.writeHead(200);
    res.end(content);
    console.log("Successfully served stardust.html");
  });
});

// Start server on port 3456
const PORT = 3456;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running at http://0.0.0.0:${PORT}/`);
  console.log(`You can view the 406 Stardust Ct property analysis by opening this URL.`);
});
