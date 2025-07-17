const { GoogleGenerativeAI } = require("@google/generative-ai");
const config = require("config");

const apiKey = config.get("gemini.apiKey");
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

async function getComprehensiveAnalysis(asset, timeframes) {
  const analysis = {};

  for (const timeframe of timeframes) {
    const prompt = `
      Analyze the asset ${asset} for the ${timeframe} timeframe.
      Provide the following analysis:
      - Key support and resistance levels.
      - RSI, MACD, and Bollinger Bands analysis.
      - 50-period and 200-period EMA status.
      - An AI-generated summary of the technical outlook.
    `;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      analysis[timeframe] = response.text();
    } catch (error) {
      console.error(`Error getting analysis for ${asset} on ${timeframe}:`, error);
      analysis[timeframe] = "Error retrieving analysis.";
    }
  }

  return analysis;
}

module.exports = {
  getComprehensiveAnalysis,
};