const { use_mcp_tool } = require('@smithery/mcp-client');

async function getSocialMediaInsights(asset) {
  const { ticker, name } = asset;

  const exaSearchPromise = use_mcp_tool({
    server_name: 'exa',
    tool_name: 'web_search_exa',
    arguments: {
      query: `${ticker} cryptocurrency news`,
      num_results: 5,
      time_filter: '72h'
    }
  });

  const twitterSearchPromise = use_mcp_tool({
    server_name: 'mcp-twikit',
    tool_name: 'search_twitter',
    arguments: {
      query: `(${ticker} OR #${name}) lang:en`,
      count: 15,
      sort_by: 'Latest'
    }
  });

  const redditSearchPromise = use_mcp_tool({
    server_name: 'scrapegraph-mcp',
    tool_name: 'searchscraper',
    arguments: {
      user_prompt: `Top posts about ${name} in r/CryptoCurrency, r/Bitcoin, r/ethtrader from the last 48 hours`
    }
  });

  try {
    const [exaResults, twitterResults, redditResults] = await Promise.all([
      exaSearchPromise,
      twitterSearchPromise,
      redditSearchPromise
    ]);

    return {
      news: exaResults,
      tweets: twitterResults,
      reddit: redditResults
    };
  } catch (error) {
    console.error('Error fetching social media insights:', error);
    throw error;
  }
}

module.exports = {
  getSocialMediaInsights
};