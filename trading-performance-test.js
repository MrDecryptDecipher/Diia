#!/usr/bin/env node

/**
 * TRADING PERFORMANCE TEST SUITE
 * Tests trading frequency, execution speed, and performance metrics
 */

const axios = require('axios');
const fs = require('fs');

class TradingPerformanceTester {
    constructor() {
        this.baseUrl = 'http://localhost:10002';
        this.testData = [];
    }

    log(message, type = 'INFO') {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] ${type}: ${message}`);
    }

    async measureApiResponseTime(endpoint) {
        const startTime = Date.now();
        try {
            const response = await axios.get(`${this.baseUrl}${endpoint}`);
            const responseTime = Date.now() - startTime;
            return { success: true, responseTime, status: response.status };
        } catch (error) {
            const responseTime = Date.now() - startTime;
            return { success: false, responseTime, error: error.message };
        }
    }

    async testApiPerformance() {
        this.log('🧪 Testing API Performance', 'TEST');
        
        const endpoints = [
            '/api/health',
            '/api/trading/status',
            '/api/trading/positions',
            '/api/trading/capital',
            '/api/trading/metrics',
            '/api/market/data'
        ];
        
        const results = {};
        
        for (const endpoint of endpoints) {
            const measurements = [];
            
            // Take 5 measurements for each endpoint
            for (let i = 0; i < 5; i++) {
                const result = await this.measureApiResponseTime(endpoint);
                measurements.push(result.responseTime);
                await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
            }
            
            const avgResponseTime = measurements.reduce((a, b) => a + b, 0) / measurements.length;
            const maxResponseTime = Math.max(...measurements);
            const minResponseTime = Math.min(...measurements);
            
            results[endpoint] = {
                average: avgResponseTime,
                max: maxResponseTime,
                min: minResponseTime,
                measurements
            };
            
            this.log(`${endpoint}: avg=${avgResponseTime.toFixed(2)}ms, max=${maxResponseTime}ms, min=${minResponseTime}ms`);
        }
        
        return results;
    }

    async monitorTradingFrequency(duration = 60000) {
        this.log(`🧪 Monitoring Trading Frequency for ${duration/1000} seconds`, 'TEST');
        
        const startTime = Date.now();
        let initialTrades = 0;
        let currentTrades = 0;
        const tradeSnapshots = [];
        
        // Get initial trade count
        try {
            const response = await axios.get(`${this.baseUrl}/api/trading/metrics`);
            initialTrades = response.data.totalTrades || 0;
            this.log(`Initial trade count: ${initialTrades}`);
        } catch (error) {
            this.log(`Error getting initial metrics: ${error.message}`, 'ERROR');
            return null;
        }
        
        // Monitor for the specified duration
        while (Date.now() - startTime < duration) {
            try {
                const response = await axios.get(`${this.baseUrl}/api/trading/metrics`);
                currentTrades = response.data.totalTrades || 0;
                
                tradeSnapshots.push({
                    timestamp: Date.now(),
                    totalTrades: currentTrades,
                    newTrades: currentTrades - initialTrades
                });
                
                if (tradeSnapshots.length > 1) {
                    const prev = tradeSnapshots[tradeSnapshots.length - 2];
                    const current = tradeSnapshots[tradeSnapshots.length - 1];
                    const tradesPerSecond = (current.totalTrades - prev.totalTrades) / 
                                          ((current.timestamp - prev.timestamp) / 1000);
                    
                    if (tradesPerSecond > 0) {
                        this.log(`Trading rate: ${tradesPerSecond.toFixed(2)} trades/second`);
                    }
                }
                
            } catch (error) {
                this.log(`Error monitoring trades: ${error.message}`, 'ERROR');
            }
            
            await new Promise(resolve => setTimeout(resolve, 5000)); // Check every 5 seconds
        }
        
        const finalTrades = currentTrades;
        const totalNewTrades = finalTrades - initialTrades;
        const actualDuration = (Date.now() - startTime) / 1000;
        const tradesPerMinute = (totalNewTrades / actualDuration) * 60;
        
        this.log(`Trading frequency results:`);
        this.log(`  Initial trades: ${initialTrades}`);
        this.log(`  Final trades: ${finalTrades}`);
        this.log(`  New trades: ${totalNewTrades}`);
        this.log(`  Duration: ${actualDuration.toFixed(2)} seconds`);
        this.log(`  Rate: ${tradesPerMinute.toFixed(2)} trades/minute`);
        
        return {
            initialTrades,
            finalTrades,
            newTrades: totalNewTrades,
            duration: actualDuration,
            tradesPerMinute,
            snapshots: tradeSnapshots
        };
    }

    async testPositionManagement() {
        this.log('🧪 Testing Position Management', 'TEST');
        
        const measurements = [];
        
        for (let i = 0; i < 10; i++) {
            try {
                const startTime = Date.now();
                const response = await axios.get(`${this.baseUrl}/api/trading/positions`);
                const responseTime = Date.now() - startTime;
                
                const data = response.data;
                measurements.push({
                    responseTime,
                    openPositions: data.openPositions || 0,
                    maxPositions: data.maxPositions || 0,
                    utilizationRate: ((data.openPositions || 0) / (data.maxPositions || 1)) * 100
                });
                
                await new Promise(resolve => setTimeout(resolve, 2000));
            } catch (error) {
                this.log(`Error in position management test: ${error.message}`, 'ERROR');
            }
        }
        
        if (measurements.length > 0) {
            const avgResponseTime = measurements.reduce((sum, m) => sum + m.responseTime, 0) / measurements.length;
            const avgUtilization = measurements.reduce((sum, m) => sum + m.utilizationRate, 0) / measurements.length;
            const maxPositions = measurements[0].maxPositions;
            
            this.log(`Position management results:`);
            this.log(`  Average response time: ${avgResponseTime.toFixed(2)}ms`);
            this.log(`  Average utilization: ${avgUtilization.toFixed(2)}%`);
            this.log(`  Max positions: ${maxPositions}`);
            
            return {
                avgResponseTime,
                avgUtilization,
                maxPositions,
                measurements
            };
        }
        
        return null;
    }

    async testCapitalEfficiency() {
        this.log('🧪 Testing Capital Efficiency', 'TEST');
        
        try {
            const response = await axios.get(`${this.baseUrl}/api/trading/capital`);
            const capital = response.data;
            
            const utilizationRate = (capital.allocatedCapital / capital.totalCapital) * 100;
            const efficiency = capital.allocatedCapital > 0 ? 'Active' : 'Idle';
            
            this.log(`Capital efficiency results:`);
            this.log(`  Total capital: ${capital.totalCapital} USDT`);
            this.log(`  Allocated capital: ${capital.allocatedCapital} USDT`);
            this.log(`  Available capital: ${capital.availableCapital} USDT`);
            this.log(`  Utilization rate: ${utilizationRate.toFixed(2)}%`);
            this.log(`  Status: ${efficiency}`);
            
            return {
                totalCapital: capital.totalCapital,
                allocatedCapital: capital.allocatedCapital,
                availableCapital: capital.availableCapital,
                utilizationRate,
                efficiency
            };
            
        } catch (error) {
            this.log(`Error testing capital efficiency: ${error.message}`, 'ERROR');
            return null;
        }
    }

    async testSystemLoad() {
        this.log('🧪 Testing System Load Under Stress', 'TEST');
        
        const concurrentRequests = 20;
        const promises = [];
        
        const startTime = Date.now();
        
        // Send concurrent requests
        for (let i = 0; i < concurrentRequests; i++) {
            promises.push(this.measureApiResponseTime('/api/trading/status'));
        }
        
        const results = await Promise.all(promises);
        const totalTime = Date.now() - startTime;
        
        const successCount = results.filter(r => r.success).length;
        const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;
        const maxResponseTime = Math.max(...results.map(r => r.responseTime));
        
        this.log(`System load test results:`);
        this.log(`  Concurrent requests: ${concurrentRequests}`);
        this.log(`  Successful requests: ${successCount}/${concurrentRequests}`);
        this.log(`  Success rate: ${((successCount / concurrentRequests) * 100).toFixed(2)}%`);
        this.log(`  Average response time: ${avgResponseTime.toFixed(2)}ms`);
        this.log(`  Max response time: ${maxResponseTime}ms`);
        this.log(`  Total test time: ${totalTime}ms`);
        
        return {
            concurrentRequests,
            successCount,
            successRate: (successCount / concurrentRequests) * 100,
            avgResponseTime,
            maxResponseTime,
            totalTime
        };
    }

    async runPerformanceTests() {
        this.log('🚀 Starting Trading Performance Test Suite', 'START');
        this.log('=' * 70);
        
        const results = {};
        
        try {
            // API Performance Test
            this.log('\n📊 API Performance Test');
            results.apiPerformance = await this.testApiPerformance();
            
            // Trading Frequency Test
            this.log('\n📈 Trading Frequency Test');
            results.tradingFrequency = await this.monitorTradingFrequency(30000); // 30 seconds
            
            // Position Management Test
            this.log('\n🎯 Position Management Test');
            results.positionManagement = await this.testPositionManagement();
            
            // Capital Efficiency Test
            this.log('\n💰 Capital Efficiency Test');
            results.capitalEfficiency = await this.testCapitalEfficiency();
            
            // System Load Test
            this.log('\n⚡ System Load Test');
            results.systemLoad = await this.testSystemLoad();
            
        } catch (error) {
            this.log(`Performance test error: ${error.message}`, 'ERROR');
        }
        
        // Generate performance report
        this.generatePerformanceReport(results);
        
        return results;
    }

    generatePerformanceReport(results) {
        this.log('\n' + '=' * 70);
        this.log('📊 TRADING PERFORMANCE REPORT', 'REPORT');
        this.log('=' * 70);
        
        // API Performance Summary
        if (results.apiPerformance) {
            const avgTimes = Object.values(results.apiPerformance).map(r => r.average);
            const overallAvg = avgTimes.reduce((a, b) => a + b, 0) / avgTimes.length;
            this.log(`\n🔌 API Performance:`);
            this.log(`  Overall average response time: ${overallAvg.toFixed(2)}ms`);
            this.log(`  ${overallAvg < 100 ? '✅ EXCELLENT' : overallAvg < 500 ? '⚠️  ACCEPTABLE' : '❌ SLOW'}`);
        }
        
        // Trading Frequency Summary
        if (results.tradingFrequency) {
            this.log(`\n📈 Trading Frequency:`);
            this.log(`  Rate: ${results.tradingFrequency.tradesPerMinute.toFixed(2)} trades/minute`);
            this.log(`  ${results.tradingFrequency.tradesPerMinute > 10 ? '✅ HIGH FREQUENCY' : 
                      results.tradingFrequency.tradesPerMinute > 1 ? '⚠️  MODERATE' : '❌ LOW FREQUENCY'}`);
        }
        
        // Position Management Summary
        if (results.positionManagement) {
            this.log(`\n🎯 Position Management:`);
            this.log(`  Average utilization: ${results.positionManagement.avgUtilization.toFixed(2)}%`);
            this.log(`  ${results.positionManagement.avgUtilization > 80 ? '✅ HIGH UTILIZATION' : 
                      results.positionManagement.avgUtilization > 50 ? '⚠️  MODERATE' : '❌ LOW UTILIZATION'}`);
        }
        
        // System Load Summary
        if (results.systemLoad) {
            this.log(`\n⚡ System Load:`);
            this.log(`  Success rate: ${results.systemLoad.successRate.toFixed(2)}%`);
            this.log(`  ${results.systemLoad.successRate > 95 ? '✅ EXCELLENT' : 
                      results.systemLoad.successRate > 90 ? '⚠️  GOOD' : '❌ POOR'}`);
        }
        
        // Save detailed report
        const reportPath = '/home/ubuntu/Sandeep/projects/omni/performance-report.json';
        fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
        this.log(`\n📄 Detailed performance report saved to: ${reportPath}`);
        
        this.log('\n🎯 PERFORMANCE TEST COMPLETE!');
    }
}

// Run the performance tests
if (require.main === module) {
    const tester = new TradingPerformanceTester();
    tester.runPerformanceTests().catch(console.error);
}

module.exports = TradingPerformanceTester;
