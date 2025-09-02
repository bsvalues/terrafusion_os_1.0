// POST /api/plugin-health [ids]
const express = require('express');
const router = express.Router();

// For demo, randomize health
router.post('/', (req, res) => {
  const ids = req.body;
  const result = {};
  ids.forEach(id => {
    result[id] = Math.random() > 0.2; // 80% healthy
  });
  res.json(result);
});

module.exports = router;
