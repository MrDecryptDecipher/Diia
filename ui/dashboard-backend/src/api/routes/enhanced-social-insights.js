/**
 * ENHANCED SOCIAL MEDIA INSIGHTS API ROUTES
 * 
 * Provides comprehensive social media sentiment analysis using:
 * - Real Twitter API v2 integration
 * - Reddit API for community sentiment
 * - News API for media coverage analysis
 * - Advanced sentiment analysis with NLP
 * - Super Intelligent MCP Orchestration
 * 
 * Enhanced for OMNI asset analysis system
 */

const express = require('express');
const router = express.Router();
const logger = require('../../utils/logger');
const socialMediaService = require('../../services/enhancedSocialMediaService');
const mcpOrchestrationService = require('../../services/mcpOrchestrationService');

/**
 * POST /api/social-insights/comprehensive
 * Get comprehensive social media insights for an asset
 */
router.post('/comprehensive', async (req, res) => {
  try {
    const { asset, searchQueries } = req.body;
    
    if (!asset) {
      return res.status(400).json({
        error: 'Asset parameter is required',
        message: 'Please provide an asset symbol for analysis'
      });
    }

    logger.info(`🔍 Starting comprehensive social media analysis for ${asset}`);

    // Get comprehensive social media insights and MCP orchestration in parallel
    const [insights, mcpIntelligence] = await Promise.allSettled([
      socialMediaService.getComprehensiveSocialInsights(asset),
      mcpOrchestrationService.orchestrateSocialIntelligence(asset, 'social_media')
    ]);
    
    // Process results from both services
    const socialInsights = insights.status === 'fulfilled' ? insights.value : null;
    const mcpData = mcpIntelligence.status === 'fulfilled' ? mcpIntelligence.value : null;

    // Format response for frontend compatibility
    const response = {
      asset: asset,
      timestamp: socialInsights?.timestamp || new Date().toISOString(),
      overallScore: socialInsights ? Math.max(0, Math.min(1, (socialInsights.overallSentiment.score + 1) / 2)) : 0.5,
      overallSentiment: socialInsights?.overallSentiment.label || 'neutral',
      confidence: socialInsights?.overallSentiment.confidence || 0,
      breakdown: {
        twitter: socialInsights?.sources?.twitter?.volume || 0,
        reddit: socialInsights?.sources?.reddit?.volume || 0,
        news: socialInsights?.sources?.news?.volume || 0,
        mcpSources: mcpData?.orchestration?.totalSources || 0
      },
      sources: socialInsights?.sources || [],
      trends: {
        bullish: 0,
        bearish: 0,
        neutral: 0
      },
      keywords: socialInsights?.keywords || [],
      mcpOrchestration: socialInsights?.mcpOrchestration || mcpData?.orchestration || {
        enabled: true,
        brand: "🧠 Super Intelligent MCP Orchestration",
        sources: ["Twitter API v2", "Reddit API", "News API", "Advanced NLP"],
        performance: "Real-time analysis with rate limiting",
        serversUsed: [],
        successRate: 0
      }
    };

    // Calculate trends from sources array
    if (socialInsights?.sources && Array.isArray(socialInsights.sources)) {
      socialInsights.sources.forEach(source => {
        const sentiment = source.sentiment || 0.5;
        if (sentiment > 0.6) {
          response.trends.bullish++;
        } else if (sentiment < 0.4) {
          response.trends.bearish++;
        } else {
          response.trends.neutral++;
        }
      });
    }

    // Legacy Twitter data processing (now handled by sources array above)
    // if (socialInsights?.sources?.twitter && !socialInsights.sources.twitter.error) {
    //   const twitterData = socialInsights.sources.twitter;
    //   if (twitterData.posts && Array.isArray(twitterData.posts)) {
    //     response.sources.push(...twitterData.posts.slice(0, 5).map(post => ({
    //       source: 'twitter',
    //       title: post.text?.substring(0, 100) + '...' || 'Twitter post',
    //       url: '#',
    //       sentiment: getSentimentScore(post.comparative || 0),
    //       keywords: extractKeywords(post.text || '', asset)
    //     })));

    //     // Update trends
    //     twitterData.posts.forEach(post => {
    //       const label = getSentimentLabel(post.comparative || 0);
    //       response.trends[label]++;
    //     });
    //   }
    // }

    // Legacy Reddit and News data processing (now handled by sources array above)
    // if (socialInsights?.sources?.reddit && !socialInsights.sources.reddit.error) {
    //   const redditData = socialInsights.sources.reddit;
    //   if (redditData.posts && Array.isArray(redditData.posts)) {
    //     response.sources.push(...redditData.posts.slice(0, 5).map(post => ({
    //       source: 'reddit',
    //       title: post.title || 'Reddit post',
    //       url: '#',
    //       sentiment: getSentimentScore(post.comparative || 0),
    //       keywords: extractKeywords(post.title || '', asset)
    //     })));

    //     // Update trends
    //     redditData.posts.forEach(post => {
    //       const label = getSentimentLabel(post.comparative || 0);
    //       response.trends[label]++;
    //     });
    //   }
    // }

    // if (socialInsights?.sources?.news && !socialInsights.sources.news.error) {
    //   const newsData = socialInsights.sources.news;
    //   if (newsData.articles && Array.isArray(newsData.articles)) {
    //     response.sources.push(...newsData.articles.slice(0, 5).map(article => ({
    //       source: 'news',
    //       title: article.title || 'News article',
    //       url: article.url || '#',
    //       sentiment: getSentimentScore(article.comparative || 0),
    //       keywords: extractKeywords((article.title || '') + ' ' + (article.description || ''), asset)
    //     })));

    //     // Update trends
    //     newsData.articles.forEach(article => {
    //       const label = getSentimentLabel(article.comparative || 0);
    //       response.trends[label]++;
    //     });
    //   }
    // }

    // Extract top keywords
    const allKeywords = response.sources.flatMap(source => source.keywords);
    response.keywords = getTopKeywords(allKeywords);

    logger.info(`✅ Social media analysis complete for ${asset}: ${response.overallSentiment} (${(response.overallScore * 100).toFixed(1)}%)`);
    
    res.json(response);

  } catch (error) {
    logger.error(`❌ Error in comprehensive social insights:`, error);
    res.status(500).json({
      error: 'Social media analysis failed',
      message: error.message,
      asset: req.body?.asset || 'unknown'
    });
  }
});

/**
 * POST /api/social-insights/search (Legacy endpoint for compatibility)
 */
router.post('/search', async (req, res) => {
  try {
    const { asset } = req.body;
    
    if (!asset) {
      return res.status(400).json({
        error: 'Asset parameter is required'
      });
    }

    // Redirect to comprehensive analysis
    req.body.asset = asset;
    return router.handle(req, res, () => {
      req.url = '/comprehensive';
      req.method = 'POST';
      router(req, res);
    });

  } catch (error) {
    logger.error(`❌ Error in legacy search endpoint:`, error);
    res.status(500).json({
      error: 'Social media search failed',
      message: error.message
    });
  }
});

/**
 * GET /api/social-insights/mcp-status
 * Get MCP orchestration status and configuration
 */
router.get('/mcp-status', (req, res) => {
  try {
    const mcpStatus = mcpOrchestrationService.getMCPOrchestrationStatus();
    res.json(mcpStatus);
  } catch (error) {
    logger.error(`❌ Error getting MCP status:`, error);
    res.status(500).json({
      error: 'Failed to get MCP status',
      message: error.message
    });
  }
});

/**
 * POST /api/social-insights/mcp-test
 * Test MCP orchestration with a specific asset
 */
router.post('/mcp-test', async (req, res) => {
  try {
    const { asset } = req.body;

    if (!asset) {
      return res.status(400).json({
        error: 'Asset parameter is required'
      });
    }

    logger.info(`🧠 Testing MCP orchestration for ${asset}`);

    const mcpResults = await mcpOrchestrationService.orchestrateSocialIntelligence(asset, 'comprehensive');

    res.json(mcpResults);

  } catch (error) {
    logger.error(`❌ Error in MCP test:`, error);
    res.status(500).json({
      error: 'MCP orchestration test failed',
      message: error.message
    });
  }
});

/**
 * GET /api/social-insights/status
 * Get service status and configuration
 */
router.get('/status', (req, res) => {
  res.json({
    status: 'active',
    service: 'Enhanced Social Media Insights',
    version: '2.0.0',
    features: {
      twitterAPI: !!process.env.TWITTER_BEARER_TOKEN,
      redditAPI: !!(process.env.REDDIT_CLIENT_ID && process.env.REDDIT_CLIENT_SECRET),
      newsAPI: !!process.env.NEWS_API_KEY,
      sentimentAnalysis: true,
      rateLimiting: true,
      caching: true,
      mcpOrchestration: true
    },
    mcpOrchestration: {
      enabled: true,
      brand: "🧠 Super Intelligent MCP Orchestration",
      smitheryKey: !!process.env.SMITHERY_KEY || '0ce87743-dd43-4c21-9578-96728550b6f2',
      capabilities: [
        "Exa Search MCP - Web intelligence",
        "Browserbase MCP - Cloud browser automation",
        "ScrapeGraph MCP - AI-powered data extraction",
        "Twikit Twitter MCP - Real Twitter data",
        "Firecrawl MCP - Advanced web scraping",
        "Cloudflare Playwright MCP - Browser interactions",
        "Browser Use MCP - Accessibility snapshots"
      ]
    },
    timestamp: new Date().toISOString()
  });
});

/**
 * Helper function to convert sentiment score to 0-1 range
 */
function getSentimentScore(comparative) {
  return Math.max(0, Math.min(1, (comparative + 1) / 2));
}

/**
 * Helper function to get sentiment label
 */
function getSentimentLabel(score) {
  if (score > 0.1) return 'bullish';
  if (score < -0.1) return 'bearish';
  return 'neutral';
}

/**
 * Helper function to extract keywords from text
 */
function extractKeywords(text, asset) {
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => 
      word.length > 3 && 
      word !== asset.toLowerCase() &&
      !['this', 'that', 'with', 'have', 'will', 'from', 'they', 'been', 'said', 'each', 'which', 'their', 'time', 'would', 'there', 'could', 'other'].includes(word)
    );
  
  const wordCount = {};
  words.forEach(word => {
    wordCount[word] = (wordCount[word] || 0) + 1;
  });
  
  return Object.entries(wordCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([word]) => ({ keyword: word, count: wordCount[word] }));
}

/**
 * Helper function to get top keywords across all sources
 */
function getTopKeywords(allKeywords) {
  const keywordCount = {};
  
  allKeywords.forEach(keywordObj => {
    const word = keywordObj.keyword;
    keywordCount[word] = (keywordCount[word] || 0) + keywordObj.count;
  });
  
  return Object.entries(keywordCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([keyword, count]) => ({ keyword, count }));
}

module.exports = router;
