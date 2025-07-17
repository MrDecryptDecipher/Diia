/**
 * 🎯 PRODUCTION API ROUTES - REAL SYSTEM MONITORING & CONTROL
 * 
 * API endpoints for production-ready monitoring, risk management,
 * and testing of the OMNI trading system.
 */

const express = require('express');
const router = express.Router();
const logger = require('../../utils/logger');

// Import production services
const productionPerformanceMonitor = require('../../services/production-performance-monitor');
const productionRiskManager = require('../../services/production-risk-manager');
const productionTestingFramework = require('../../services/production-testing-framework');
const real750TradesEngine = require('../../services/real-750-trades-engine');

/**
 * GET /api/production/performance
 * Get comprehensive performance report
 */
router.get('/performance', async (req, res) => {
  try {
    const report = productionPerformanceMonitor.getPerformanceReport();
    
    res.json({
      success: true,
      data: report,
      timestamp: new Date()
    });
  } catch (error) {
    logger.error('Failed to get performance report:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/production/risk
 * Get comprehensive risk report
 */
router.get('/risk', async (req, res) => {
  try {
    const report = productionRiskManager.getRiskReport();
    
    res.json({
      success: true,
      data: report,
      timestamp: new Date()
    });
  } catch (error) {
    logger.error('Failed to get risk report:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/production/test
 * Run comprehensive production tests
 */
router.post('/test', async (req, res) => {
  try {
    // Check if tests are already running
    const status = productionTestingFramework.getTestStatus();
    if (status.isRunning) {
      return res.status(409).json({
        success: false,
        error: 'Tests are already running',
        status
      });
    }
    
    // Start tests asynchronously
    productionTestingFramework.runComprehensiveTests()
      .then(report => {
        logger.info('Production tests completed successfully');
      })
      .catch(error => {
        logger.error('Production tests failed:', error);
      });
    
    res.json({
      success: true,
      message: 'Production tests started',
      status: productionTestingFramework.getTestStatus()
    });
    
  } catch (error) {
    logger.error('Failed to start production tests:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/production/test/status
 * Get current test status
 */
router.get('/test/status', (req, res) => {
  try {
    const status = productionTestingFramework.getTestStatus();
    
    res.json({
      success: true,
      data: status,
      timestamp: new Date()
    });
  } catch (error) {
    logger.error('Failed to get test status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/production/health
 * Get overall system health status
 */
router.get('/health', async (req, res) => {
  try {
    const performanceReport = productionPerformanceMonitor.getPerformanceReport();
    const riskReport = productionRiskManager.getRiskReport();
    const testStatus = productionTestingFramework.getTestStatus();
    
    // Calculate overall health score
    let healthScore = 100;
    const issues = [];
    
    // Check performance metrics
    if (performanceReport.system.memoryUsage > 400) {
      healthScore -= 20;
      issues.push('High memory usage');
    }
    
    if (performanceReport.system.apiSuccessRate < 95) {
      healthScore -= 30;
      issues.push('Low API success rate');
    }
    
    // Check risk metrics
    if (riskReport.riskState.riskLevel === 'CRITICAL') {
      healthScore -= 50;
      issues.push('Critical risk level');
    } else if (riskReport.riskState.riskLevel === 'HIGH') {
      healthScore -= 25;
      issues.push('High risk level');
    }
    
    if (riskReport.riskState.emergencyStopActive) {
      healthScore -= 40;
      issues.push('Emergency stop active');
    }
    
    // Determine overall status
    let status = 'HEALTHY';
    if (healthScore < 50) status = 'CRITICAL';
    else if (healthScore < 70) status = 'WARNING';
    else if (healthScore < 90) status = 'DEGRADED';
    
    const healthReport = {
      status,
      healthScore,
      issues,
      components: {
        performanceMonitor: {
          status: performanceReport.system.memoryUsage < 500 ? 'HEALTHY' : 'WARNING',
          uptime: performanceReport.system.uptime,
          memoryUsage: performanceReport.system.memoryUsage
        },
        riskManager: {
          status: riskReport.riskState.emergencyStopActive ? 'CRITICAL' : 'HEALTHY',
          riskLevel: riskReport.riskState.riskLevel,
          monitoring: riskReport.monitoring.isActive
        },
        testingFramework: {
          status: testStatus.isRunning ? 'RUNNING' : 'READY',
          lastTestResults: testStatus.progress
        }
      },
      timestamp: new Date()
    };
    
    res.json({
      success: true,
      data: healthReport
    });
    
  } catch (error) {
    logger.error('Failed to get health status:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      data: {
        status: 'ERROR',
        healthScore: 0,
        issues: ['Health check failed'],
        timestamp: new Date()
      }
    });
  }
});

/**
 * GET /api/production/metrics/live
 * Get live system metrics
 */
router.get('/metrics/live', async (req, res) => {
  try {
    const performanceReport = productionPerformanceMonitor.getPerformanceReport();
    const riskReport = productionRiskManager.getRiskReport();
    
    const liveMetrics = {
      performance: {
        totalTrades: performanceReport.summary.totalTrades,
        winRate: performanceReport.summary.winRate,
        profitPerTrade: performanceReport.summary.profitPerTrade,
        currentDrawdown: performanceReport.summary.currentDrawdown,
        apiSuccessRate: performanceReport.system.apiSuccessRate,
        averageApiResponseTime: performanceReport.system.averageApiResponseTime
      },
      risk: {
        riskLevel: riskReport.riskState.riskLevel,
        totalCapitalUsed: riskReport.riskState.totalCapitalUsed,
        currentDrawdown: riskReport.riskState.currentDrawdown,
        activePositions: riskReport.riskState.activePositions || 0,
        emergencyStopActive: riskReport.riskState.emergencyStopActive
      },
      system: {
        uptime: performanceReport.system.uptime,
        memoryUsage: performanceReport.system.memoryUsage,
        timestamp: Date.now()
      }
    };
    
    res.json({
      success: true,
      data: liveMetrics
    });
    
  } catch (error) {
    logger.error('Failed to get live metrics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/production/risk/emergency-stop
 * Trigger emergency stop
 */
router.post('/risk/emergency-stop', async (req, res) => {
  try {
    const { reason } = req.body;
    const stopReason = reason || 'Manual emergency stop via API';
    
    await productionRiskManager.triggerEmergencyStop(stopReason);
    
    res.json({
      success: true,
      message: 'Emergency stop triggered',
      reason: stopReason,
      timestamp: new Date()
    });
    
  } catch (error) {
    logger.error('Failed to trigger emergency stop:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/production/alerts
 * Get active alerts and recent events
 */
router.get('/alerts', async (req, res) => {
  try {
    const riskReport = productionRiskManager.getRiskReport();
    
    const alerts = {
      active: riskReport.activeAlerts || [],
      recent: riskReport.recentRiskEvents || [],
      summary: {
        totalActive: (riskReport.activeAlerts || []).length,
        criticalAlerts: (riskReport.activeAlerts || []).filter(a => a.severity === 'CRITICAL').length,
        highAlerts: (riskReport.activeAlerts || []).filter(a => a.severity === 'HIGH').length
      }
    };
    
    res.json({
      success: true,
      data: alerts,
      timestamp: new Date()
    });
    
  } catch (error) {
    logger.error('Failed to get alerts:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/production/positions/validation
 * Validate current positions against risk limits
 */
router.get('/positions/validation', async (req, res) => {
  try {
    // This would trigger a real-time position validation
    await productionRiskManager.validatePositions();
    
    const riskReport = productionRiskManager.getRiskReport();
    
    res.json({
      success: true,
      data: {
        trackedPositions: riskReport.trackedPositions,
        riskState: riskReport.riskState,
        validationTimestamp: Date.now()
      }
    });
    
  } catch (error) {
    logger.error('Failed to validate positions:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/production/capital/status
 * Get detailed capital management status
 */
router.get('/capital/status', async (req, res) => {
  try {
    const performanceReport = productionPerformanceMonitor.getPerformanceReport();
    const riskReport = productionRiskManager.getRiskReport();

    const capitalStatus = {
      limits: {
        totalCapitalLimit: 12.0,
        maxPositionSize: 5.0,
        maxConcurrentPositions: 2,
        safetyBuffer: 2.0
      },
      current: {
        totalCapitalUsed: riskReport.riskState.totalCapitalUsed,
        capitalUtilization: performanceReport.capital.capitalUtilization,
        activePositions: riskReport.riskState.activePositions || 0,
        remainingCapital: 12.0 - (riskReport.riskState.totalCapitalUsed || 0)
      },
      compliance: {
        withinLimits: (riskReport.riskState.totalCapitalUsed || 0) <= 12.0,
        utilizationPercent: ((riskReport.riskState.totalCapitalUsed || 0) / 12.0) * 100
      }
    };

    res.json({
      success: true,
      data: capitalStatus,
      timestamp: new Date()
    });

  } catch (error) {
    logger.error('Failed to get capital status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/production/750-trades/status
 * Get real 750 trades engine status
 */
router.get('/750-trades/status', (req, res) => {
  try {
    const status = real750TradesEngine.getStatus();

    res.json({
      success: true,
      data: status,
      timestamp: new Date()
    });

  } catch (error) {
    logger.error('Failed to get 750 trades engine status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/production/750-trades/start
 * Start the real 750 trades engine
 */
router.post('/750-trades/start', async (req, res) => {
  try {
    await real750TradesEngine.initializeEngine();

    res.json({
      success: true,
      message: 'Real 750 trades engine started successfully',
      timestamp: new Date()
    });

  } catch (error) {
    logger.error('Failed to start 750 trades engine:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/production/750-trades/stop
 * Stop the real 750 trades engine
 */
router.post('/750-trades/stop', (req, res) => {
  try {
    real750TradesEngine.stop();

    res.json({
      success: true,
      message: 'Real 750 trades engine stopped successfully',
      timestamp: new Date()
    });

  } catch (error) {
    logger.error('Failed to stop 750 trades engine:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
