const express = require('express');
const router = express.Router();
const geminiService = require('../services/geminiService');

router.post('/comprehensive-analysis', async (req, res) => {
  const { asset, timeframes } = req.body;

  if (!asset || !timeframes) {
    return res.status(400).json({ error: 'Asset and timeframes are required.' });
  }

  try {
    const analysis = await geminiService.getComprehensiveAnalysis(asset, timeframes);
    res.json(analysis);
  } catch (error) {
    console.error('Error in /comprehensive-analysis route:', error);
    res.status(500).json({ error: 'Failed to get Gemini analysis.' });
  }
});

module.exports = router;