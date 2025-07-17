const express = require('express');
const cors = require('cors');
const assetsRouter = require('./routes/assets');
const socialInsightsRouter = require('./routes/socialInsights');
const geminiIntelligenceRouter = require('./routes/geminiIntelligence');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/assets', assetsRouter);
app.use('/api/social-insights', socialInsightsRouter);
app.use('/api/gemini', geminiIntelligenceRouter);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});