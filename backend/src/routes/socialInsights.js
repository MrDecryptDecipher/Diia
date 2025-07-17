const express = require('express');
const router = express.Router();
const mcpOrchestrator = require('../services/mcpOrchestrator');

router.post('/', async (req, res) => {
  const { asset } = req.body;

  if (!asset || !asset.ticker || !asset.name) {
    return res.status(400).json({ message: 'Asset ticker and name are required' });
  }

  try {
    const insights = await mcpOrchestrator.getSocialMediaInsights(asset);
    res.json(insights);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching social media insights' });
  }
});

module.exports = router;