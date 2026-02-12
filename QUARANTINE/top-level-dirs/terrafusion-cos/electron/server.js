const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.TF_BRAND_PORT || 49153;

// Serve Brand_Assets directory at root
const brandDir = path.resolve(__dirname, '..', '..', 'Brand_Assets');
app.use(express.static(brandDir));

app.listen(PORT, () => {
    console.log(`Brand asset server running at http://localhost:${PORT} serving ${brandDir}`);
});
