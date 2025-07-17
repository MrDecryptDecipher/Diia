/**
 * Strategy Routes for OMNI-ALPHA VΩ∞∞ Trading System Dashboard
 *
 * This module provides API endpoints for strategy information.
 */

const express = require('express');
const router = express.Router();
const dataCache = require('../../utils/data-cache');
const tradingStrategyService = require('../../services/trading-strategy-service');
const { validateStrategyParams } = require('../../utils/validation');
const { handleError } = require('../../utils/error-handler');

// Get all strategies
router.get('/', async (req, res) => {
  try {
    // Try to get from cache first
    const cachedStrategies = dataCache.get('strategies', 'all');
    if (cachedStrategies) {
      return res.json(cachedStrategies);
    }

    // Get strategies from trading strategy service
    const strategies = await tradingStrategyService.getStrategies();
    
    if (!strategies || strategies.length === 0) {
      return res.status(404).json({ error: 'No strategies found' });
    }

    // Cache the strategies
    dataCache.set('strategies', 'all', strategies, 60000); // Cache for 1 minute

    return res.json(strategies);
  } catch (error) {
    handleError(error, res);
  }
});

// Get strategy by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate strategy ID
    if (!validateStrategyParams({ id })) {
      return res.status(400).json({ error: 'Invalid strategy ID' });
    }

    // Try to get from cache first
    const cachedStrategy = dataCache.get('strategies', `id_${id}`);
    if (cachedStrategy) {
      return res.json(cachedStrategy);
    }

    // Get strategy from trading strategy service
    const strategy = await tradingStrategyService.getStrategyById(id);
    
    if (!strategy) {
      return res.status(404).json({ error: 'Strategy not found' });
    }

    // Cache the strategy
    dataCache.set('strategies', `id_${id}`, strategy, 60000); // Cache for 1 minute

    return res.json(strategy);
  } catch (error) {
    handleError(error, res);
  }
});

// Get strategy by name
router.get('/name/:name', async (req, res) => {
  try {
    const { name } = req.params;
    
    // Validate strategy name
    if (!validateStrategyParams({ name })) {
      return res.status(400).json({ error: 'Invalid strategy name' });
    }

    // Try to get from cache first
    const cachedStrategy = dataCache.get('strategies', `name_${name}`);
    if (cachedStrategy) {
      return res.json(cachedStrategy);
    }

    // Get strategy from trading strategy service
    const strategy = await tradingStrategyService.getStrategyByName(name);
    
    if (!strategy) {
      return res.status(404).json({ error: 'Strategy not found' });
    }

    // Cache the strategy
    dataCache.set('strategies', `name_${name}`, strategy, 60000); // Cache for 1 minute

    return res.json(strategy);
  } catch (error) {
    handleError(error, res);
  }
});

// Get strategy by type
router.get('/type/:type', async (req, res) => {
  try {
    const { type } = req.params;
    
    // Validate strategy type
    if (!validateStrategyParams({ type })) {
      return res.status(400).json({ error: 'Invalid strategy type' });
    }

    // Try to get from cache first
    const cachedStrategies = dataCache.get('strategies', `type_${type}`);
    if (cachedStrategies) {
      return res.json(cachedStrategies);
    }

    // Get strategies from trading strategy service
    const strategies = await tradingStrategyService.getStrategiesByType(type);
    
    if (!strategies || strategies.length === 0) {
      return res.status(404).json({ error: 'No strategies found for this type' });
    }

    // Cache the strategies
    dataCache.set('strategies', `type_${type}`, strategies, 60000); // Cache for 1 minute

    return res.json(strategies);
  } catch (error) {
    handleError(error, res);
  }
});

// Get strategy performance
router.get('/:id/performance', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate strategy ID
    if (!validateStrategyParams({ id })) {
      return res.status(400).json({ error: 'Invalid strategy ID' });
    }

    // Try to get from cache first
    const cachedPerformance = dataCache.get('strategies', `performance_${id}`);
    if (cachedPerformance) {
      return res.json(cachedPerformance);
    }

    // Get performance from trading strategy service
    const performance = await tradingStrategyService.getStrategyPerformance(id);
    
    if (!performance) {
      return res.status(404).json({ error: 'Strategy performance data not found' });
    }

    // Cache the performance
    dataCache.set('strategies', `performance_${id}`, performance, 60000); // Cache for 1 minute

    return res.json(performance);
  } catch (error) {
    handleError(error, res);
  }
});

// Get strategy components
router.get('/:id/components', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate strategy ID
    if (!validateStrategyParams({ id })) {
      return res.status(400).json({ error: 'Invalid strategy ID' });
    }

    // Try to get from cache first
    const cachedComponents = dataCache.get('strategies', `components_${id}`);
    if (cachedComponents) {
      return res.json(cachedComponents);
    }

    // Get components from trading strategy service
    const components = await tradingStrategyService.getStrategyComponents(id);
    
    if (!components || components.length === 0) {
      return res.status(404).json({ error: 'No components found for this strategy' });
    }

    // Cache the components
    dataCache.set('strategies', `components_${id}`, components, 60000); // Cache for 1 minute

    return res.json(components);
  } catch (error) {
    handleError(error, res);
  }
});

module.exports = router;
