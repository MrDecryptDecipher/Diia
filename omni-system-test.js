#!/usr/bin/env node

/**
 * OMNI TRADING SYSTEM COMPREHENSIVE TEST
 * Tests all critical functionality of the OMNI trading system
 */

const axios = require('axios');
const fs = require('fs');

class OMNISystemTest {
    constructor() {
        this.baseUrl = 'http://localhost:10002';
        this.results = [];
        this.startTime = Date.now();
    }

    log(message, type = 'INFO') {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] ${type}: ${message}`);
    }

    async test(name, testFunction) {
        this.log(`🧪 Testing: ${name}`, 'TEST');
        const startTime = Date.now();
        
        try {
            const result = await testFunction();
            const duration = Date.now() - startTime;
            
            this.results.push({
                name,
                status: 'PASS',
                duration,
                result
            });
            
            this.log(`✅ PASSED: ${name} (${duration}ms)`, 'PASS');
            return result;
        } catch (error) {
            const duration = Date.now() - startTime;
            
            this.results.push({
                name,
                status: 'FAIL',
                duration,
                error: error.message
            });
            
            this.log(`❌ FAILED: ${name} - ${error.message}`, 'FAIL');
            return null;
        }
    }

    async testHealthCheck() {
        return this.test('Health Check', async () => {
            const response = await axios.get(`${this.baseUrl}/health`);
            if (response.status !== 200) {
                throw new Error(`Health check failed: ${response.status}`);
            }
            return response.data;
        });
    }

    async testTradingStatus() {
        return this.test('Trading Status', async () => {
            const response = await axios.get(`${this.baseUrl}/api/trading/status`);
            if (response.status !== 200) {
                throw new Error(`Trading status failed: ${response.status}`);
            }
            
            const data = response.data;
            
            // Verify critical fields
            if (typeof data.isActive !== 'boolean') {
                throw new Error('isActive is not a boolean');
            }
            
            if (typeof data.currentCapital !== 'number') {
                throw new Error('currentCapital is not a number');
            }
            
            if (data.currentCapital !== 12) {
                throw new Error(`Expected capital 12, got ${data.currentCapital}`);
            }
            
            if (typeof data.totalTrades !== 'number') {
                throw new Error('totalTrades is not a number');
            }
            
            if (typeof data.openTrades !== 'number') {
                throw new Error('openTrades is not a number');
            }
            
            this.log(`  Trading Active: ${data.isActive}`);
            this.log(`  Current Capital: ${data.currentCapital} USDT`);
            this.log(`  Total Trades: ${data.totalTrades}`);
            this.log(`  Open Trades: ${data.openTrades}`);
            this.log(`  Total Profit: ${data.totalProfit} USDT`);
            
            return data;
        });
    }

    async testSystemMetrics() {
        return this.test('System Metrics', async () => {
            const response = await axios.get(`${this.baseUrl}/api/metrics`);
            if (response.status !== 200) {
                throw new Error(`Metrics failed: ${response.status}`);
            }
            
            const data = response.data;
            this.log(`  System Uptime: ${data.uptime || 'unknown'}`);
            this.log(`  Memory Usage: ${data.memoryUsage || 'unknown'}`);
            
            return data;
        });
    }

    async testTradingReport() {
        return this.test('Trading Report', async () => {
            const response = await axios.get(`${this.baseUrl}/api/trading/report`);
            if (response.status !== 200) {
                throw new Error(`Trading report failed: ${response.status}`);
            }
            
            const data = response.data;
            this.log(`  Report generated successfully`);
            
            return data;
        });
    }

    async testBybitConnection() {
        return this.test('Bybit Connection', async () => {
            const response = await axios.get(`${this.baseUrl}/api/trading/bybit/account`);
            if (response.status !== 200) {
                throw new Error(`Bybit connection failed: ${response.status}`);
            }
            
            const data = response.data;
            this.log(`  Bybit API connected successfully`);
            
            return data;
        });
    }

    async testPositionManagement() {
        return this.test('Position Management', async () => {
            // Get current trading status to check positions
            const response = await axios.get(`${this.baseUrl}/api/trading/status`);
            if (response.status !== 200) {
                throw new Error(`Position check failed: ${response.status}`);
            }
            
            const data = response.data;
            const openTrades = data.openTrades;
            
            this.log(`  Open Positions: ${openTrades}`);
            
            // Check if position management is working
            if (openTrades >= 0 && openTrades <= 50) {
                this.log(`  Position count within limits (0-50)`);
            } else {
                throw new Error(`Position count out of range: ${openTrades}`);
            }
            
            return { openTrades };
        });
    }

    async testTradingFrequency() {
        return this.test('Trading Frequency', async () => {
            // Get initial trade count
            const initialResponse = await axios.get(`${this.baseUrl}/api/trading/status`);
            const initialTrades = initialResponse.data.totalTrades;
            
            this.log(`  Initial trades: ${initialTrades}`);
            
            // Wait 10 seconds and check again
            await new Promise(resolve => setTimeout(resolve, 10000));
            
            const finalResponse = await axios.get(`${this.baseUrl}/api/trading/status`);
            const finalTrades = finalResponse.data.totalTrades;
            
            this.log(`  Final trades: ${finalTrades}`);
            
            const newTrades = finalTrades - initialTrades;
            const tradesPerMinute = (newTrades / 10) * 60;
            
            this.log(`  New trades in 10s: ${newTrades}`);
            this.log(`  Estimated rate: ${tradesPerMinute.toFixed(2)} trades/minute`);
            
            return {
                initialTrades,
                finalTrades,
                newTrades,
                tradesPerMinute
            };
        });
    }

    async testApiPerformance() {
        return this.test('API Performance', async () => {
            const endpoints = [
                '/health',
                '/api/trading/status',
                '/api/metrics'
            ];
            
            const results = {};
            
            for (const endpoint of endpoints) {
                const measurements = [];
                
                // Take 3 measurements
                for (let i = 0; i < 3; i++) {
                    const startTime = Date.now();
                    await axios.get(`${this.baseUrl}${endpoint}`);
                    const responseTime = Date.now() - startTime;
                    measurements.push(responseTime);
                }
                
                const avgTime = measurements.reduce((a, b) => a + b, 0) / measurements.length;
                results[endpoint] = avgTime;
                
                this.log(`  ${endpoint}: ${avgTime.toFixed(2)}ms avg`);
            }
            
            return results;
        });
    }

    async testStressLoad() {
        return this.test('Stress Load Test', async () => {
            const concurrentRequests = 10;
            const promises = [];
            
            this.log(`  Sending ${concurrentRequests} concurrent requests...`);
            
            const startTime = Date.now();
            
            for (let i = 0; i < concurrentRequests; i++) {
                promises.push(axios.get(`${this.baseUrl}/api/trading/status`));
            }
            
            const results = await Promise.all(promises);
            const totalTime = Date.now() - startTime;
            
            const successCount = results.filter(r => r.status === 200).length;
            const successRate = (successCount / concurrentRequests) * 100;
            
            this.log(`  Success rate: ${successRate}%`);
            this.log(`  Total time: ${totalTime}ms`);
            
            if (successRate < 90) {
                throw new Error(`Low success rate: ${successRate}%`);
            }
            
            return {
                concurrentRequests,
                successCount,
                successRate,
                totalTime
            };
        });
    }

    async runAllTests() {
        this.log('🚀 Starting OMNI Trading System Comprehensive Test', 'START');
        this.log('=' * 70);
        
        // Core System Tests
        await this.testHealthCheck();
        await this.testTradingStatus();
        await this.testSystemMetrics();
        
        // Trading Functionality Tests
        await this.testTradingReport();
        await this.testBybitConnection();
        await this.testPositionManagement();
        
        // Performance Tests
        await this.testTradingFrequency();
        await this.testApiPerformance();
        await this.testStressLoad();
        
        // Generate final report
        this.generateReport();
    }

    generateReport() {
        const totalTime = Date.now() - this.startTime;
        const passedTests = this.results.filter(r => r.status === 'PASS').length;
        const failedTests = this.results.filter(r => r.status === 'FAIL').length;
        const totalTests = this.results.length;
        const successRate = (passedTests / totalTests) * 100;
        
        this.log('\n' + '=' * 70);
        this.log('📊 OMNI TRADING SYSTEM TEST RESULTS', 'REPORT');
        this.log('=' * 70);
        
        this.log(`Total Tests: ${totalTests}`);
        this.log(`Passed: ${passedTests}`);
        this.log(`Failed: ${failedTests}`);
        this.log(`Success Rate: ${successRate.toFixed(2)}%`);
        this.log(`Total Time: ${(totalTime / 1000).toFixed(2)} seconds`);
        
        if (failedTests > 0) {
            this.log('\n❌ FAILED TESTS:', 'ERROR');
            this.results
                .filter(r => r.status === 'FAIL')
                .forEach(test => {
                    this.log(`  - ${test.name}: ${test.error}`, 'ERROR');
                });
        }
        
        if (successRate === 100) {
            this.log('\n🎉 ALL TESTS PASSED! OMNI SYSTEM IS FULLY OPERATIONAL!', 'SUCCESS');
        } else if (successRate >= 80) {
            this.log('\n⚠️  MOST TESTS PASSED - SYSTEM IS MOSTLY FUNCTIONAL', 'WARNING');
        } else {
            this.log('\n🚨 MANY TESTS FAILED - SYSTEM NEEDS ATTENTION', 'ERROR');
        }
        
        // Save detailed report
        const reportPath = '/home/ubuntu/Sandeep/projects/omni/omni-test-report.json';
        fs.writeFileSync(reportPath, JSON.stringify({
            summary: {
                totalTests,
                passedTests,
                failedTests,
                successRate,
                totalTime
            },
            results: this.results
        }, null, 2));
        
        this.log(`\n📄 Detailed report saved to: ${reportPath}`);
    }
}

// Run the test
if (require.main === module) {
    const test = new OMNISystemTest();
    test.runAllTests().catch(console.error);
}

module.exports = OMNISystemTest;
