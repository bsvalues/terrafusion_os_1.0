// POST /api/plugin-onboarding [ids]
const express = require('express');
const router = express.Router();

router.post('/', (req, res) => {
  const ids = req.body;
  const result = {};
  ids.forEach(id => {
    result[id] = Math.random() > 0.7 ? ['Missing README', 'No healthcheck'] : [];
  });
  res.json(result);
});

module.exports = router;
