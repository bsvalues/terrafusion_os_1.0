// POST /api/launch-trends [ids]
const express = require('express');
const router = express.Router();

router.post('/', (req, res) => {
  const ids = req.body;
  const result = {};
  ids.forEach(id => {
    result[id] = Math.floor(Math.random() * 100);
  });
  res.json(result);
});

module.exports = router;
