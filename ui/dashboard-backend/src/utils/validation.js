/**
 * Validation utilities for OMNI-ALPHA VΩ∞∞ Trading System
 */

const logger = require('./logger');

/**
 * Validate strategy parameters
 * @param {Object} params - Parameters to validate
 * @returns {boolean} - Whether the parameters are valid
 */
function validateStrategyParams(params) {
  try {
    // Validate ID
    if (params.id) {
      if (typeof params.id !== 'string' || !params.id.match(/^[a-zA-Z0-9-_]+$/)) {
        logger.warn(`Invalid strategy ID: ${params.id}`);
        return false;
      }
    }

    // Validate name
    if (params.name) {
      if (typeof params.name !== 'string' || params.name.length < 3 || params.name.length > 50) {
        logger.warn(`Invalid strategy name: ${params.name}`);
        return false;
      }
    }

    // Validate type
    if (params.type) {
      const validTypes = ['trend', 'momentum', 'mean_reversion', 'breakout', 'scalping', 'grid', 'martingale', 'custom'];
      if (!validTypes.includes(params.type)) {
        logger.warn(`Invalid strategy type: ${params.type}`);
        return false;
      }
    }

    return true;
  } catch (error) {
    logger.error(`Error validating strategy parameters: ${error.message}`);
    return false;
  }
}

module.exports = {
  validateStrategyParams
}; 