// POST /api/plugin-errors [ids]
const express = require('express');
const router = express.Router();

router.post('/', (req, res) => {
  const ids = req.body;
  const result = {};
  ids.forEach(id => {
    result[id] = Math.random() > 0.8 ? ['Error: failed to start'] : [];
  });
  res.json(result);
});

module.exports = router;
