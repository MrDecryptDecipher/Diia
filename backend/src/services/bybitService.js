const { RestClientV5 } = require('bybit');

const client = new RestClientV5({
  key: process.env.BYBIT_DEMO_API_KEY,
  secret: process.env.BYBIT_DEMO_API_SECRET,
  testnet: true,
});

async function getLinearPerpetualAssets() {
  try {
    const response = await client.getInstrumentsInfo({
      category: 'linear',
    });

    if (response.retCode === 0) {
      return response.result.list;
    } else {
      throw new Error(`Bybit API error: ${response.retMsg}`);
    }
  } catch (error) {
    console.error('Error fetching Bybit assets:', error.message);
    throw error;
  }
}

module.exports = {
  getLinearPerpetualAssets
};