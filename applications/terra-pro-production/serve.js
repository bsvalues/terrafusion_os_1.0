const express = require("express");
const app = express();
const port = 3030;

// Serve static files
app.use(express.static("."));

// Start server
app.listen(port, "0.0.0.0", () => {
  console.log(
    `Property analysis dashboard running at http://0.0.0.0:${port}/stardust-dashboard.html`
  );
});
