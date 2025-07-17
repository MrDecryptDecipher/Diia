#!/usr/bin/env node

/**
 * COMPREHENSIVE OMNI TRADING SYSTEM TEST SUITE
 * Tests all critical components and functionality
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

class OMNITestSuite {
    constructor() {
        this.baseUrl = 'http://localhost:10002';
        this.testResults = [];
        this.totalTests = 0;
        this.passedTests = 0;
        this.failedTests = 0;
    }

    log(message, type = 'INFO') {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] ${type}: ${message}`);
    }

    async runTest(testName, testFunction) {
        this.totalTests++;
        this.log(`🧪 Running test: ${testName}`, 'TEST');
        
        try {
            const startTime = Date.now();
            const result = await testFunction();
            const duration = Date.now() - startTime;
            
            this.passedTests++;
            this.testResults.push({
                name: testName,
                status: 'PASS',
                duration,
                result
            });
            this.log(`✅ PASSED: ${testName} (${duration}ms)`, 'PASS');
            return result;
        } catch (error) {
            this.failedTests++;
            this.testResults.push({
                name: testName,
                status: 'FAIL',
                error: error.message,
                stack: error.stack
            });
            this.log(`❌ FAILED: ${testName} - ${error.message}`, 'FAIL');
            throw error;
        }
    }

    async testSystemHealth() {
        return this.runTest('System Health Check', async () => {
            const response = await axios.get(`${this.baseUrl}/api/health`);
            if (response.status !== 200) {
                throw new Error(`Health check failed: ${response.status}`);
            }
            return response.data;
        });
    }

    async testTradingStatus() {
        return this.runTest('Trading Status Check', async () => {
            const response = await axios.get(`${this.baseUrl}/api/trading/status`);
            if (response.status !== 200) {
                throw new Error(`Trading status failed: ${response.status}`);
            }
            
            const data = response.data;
            if (!data.isActive) {
                throw new Error('Trading is not active');
            }
            
            return data;
        });
    }

    async testCapitalAllocation() {
        return this.runTest('Capital Allocation Test', async () => {
            const response = await axios.get(`${this.baseUrl}/api/trading/capital`);
            if (response.status !== 200) {
                throw new Error(`Capital check failed: ${response.status}`);
            }
            
            const data = response.data;
            if (data.totalCapital !== 12) {
                throw new Error(`Expected 12 USDT, got ${data.totalCapital}`);
            }
            
            if (data.availableCapital < 0) {
                throw new Error(`Negative available capital: ${data.availableCapital}`);
            }
            
            return data;
        });
    }

    async testPositionLimits() {
        return this.runTest('Position Limits Test', async () => {
            const response = await axios.get(`${this.baseUrl}/api/trading/positions`);
            if (response.status !== 200) {
                throw new Error(`Positions check failed: ${response.status}`);
            }
            
            const data = response.data;
            if (data.maxPositions !== 50) {
                throw new Error(`Expected max positions 50, got ${data.maxPositions}`);
            }
            
            return data;
        });
    }

    async testMarketDataFeed() {
        return this.runTest('Market Data Feed Test', async () => {
            const response = await axios.get(`${this.baseUrl}/api/market/data`);
            if (response.status !== 200) {
                throw new Error(`Market data failed: ${response.status}`);
            }
            
            const data = response.data;
            if (!Array.isArray(data.symbols) || data.symbols.length === 0) {
                throw new Error('No market data symbols found');
            }
            
            return data;
        });
    }

    async testTradingOpportunities() {
        return this.runTest('Trading Opportunities Test', async () => {
            const response = await axios.get(`${this.baseUrl}/api/trading/opportunities`);
            if (response.status !== 200) {
                throw new Error(`Opportunities check failed: ${response.status}`);
            }
            
            const data = response.data;
            if (!Array.isArray(data.opportunities)) {
                throw new Error('Opportunities data is not an array');
            }
            
            return data;
        });
    }

    async testRiskManagement() {
        return this.runTest('Risk Management Test', async () => {
            const response = await axios.get(`${this.baseUrl}/api/trading/risk`);
            if (response.status !== 200) {
                throw new Error(`Risk management check failed: ${response.status}`);
            }
            
            const data = response.data;
            if (data.maxCapitalPerAsset > 25) {
                throw new Error(`Max capital per asset too high: ${data.maxCapitalPerAsset}%`);
            }
            
            return data;
        });
    }

    async testBybitConnection() {
        return this.runTest('Bybit API Connection Test', async () => {
            const response = await axios.get(`${this.baseUrl}/api/bybit/connection`);
            if (response.status !== 200) {
                throw new Error(`Bybit connection failed: ${response.status}`);
            }
            
            const data = response.data;
            if (!data.connected) {
                throw new Error('Bybit API not connected');
            }
            
            return data;
        });
    }

    async testTradingMetrics() {
        return this.runTest('Trading Metrics Test', async () => {
            const response = await axios.get(`${this.baseUrl}/api/trading/metrics`);
            if (response.status !== 200) {
                throw new Error(`Metrics check failed: ${response.status}`);
            }
            
            const data = response.data;
            if (typeof data.totalTrades !== 'number') {
                throw new Error('Total trades is not a number');
            }
            
            return data;
        });
    }

    async testConfigurationValues() {
        return this.runTest('Configuration Values Test', async () => {
            const response = await axios.get(`${this.baseUrl}/api/config`);
            if (response.status !== 200) {
                throw new Error(`Config check failed: ${response.status}`);
            }
            
            const data = response.data;
            
            // Check critical configuration values
            const criticalConfigs = [
                { key: 'maxConcurrentPositions', expected: 50 },
                { key: 'maxPositions', expected: 50 },
                { key: 'totalCapital', expected: 12 }
            ];
            
            for (const config of criticalConfigs) {
                if (data[config.key] !== config.expected) {
                    throw new Error(`Config ${config.key}: expected ${config.expected}, got ${data[config.key]}`);
                }
            }
            
            return data;
        });
    }

    async testStressLoad() {
        return this.runTest('Stress Load Test', async () => {
            const promises = [];
            const requestCount = 10;
            
            // Send multiple concurrent requests
            for (let i = 0; i < requestCount; i++) {
                promises.push(axios.get(`${this.baseUrl}/api/trading/status`));
            }
            
            const results = await Promise.all(promises);
            
            // Check all requests succeeded
            for (const result of results) {
                if (result.status !== 200) {
                    throw new Error(`Stress test request failed: ${result.status}`);
                }
            }
            
            return { requestCount, successCount: results.length };
        });
    }

    async testErrorHandling() {
        return this.runTest('Error Handling Test', async () => {
            try {
                // Test invalid endpoint
                await axios.get(`${this.baseUrl}/api/invalid/endpoint`);
                throw new Error('Expected 404 error but request succeeded');
            } catch (error) {
                if (error.response && error.response.status === 404) {
                    return { errorHandling: 'working' };
                }
                throw error;
            }
        });
    }

    async runAllTests() {
        this.log('🚀 Starting OMNI Trading System Comprehensive Test Suite', 'START');
        this.log('=' * 80);
        
        const startTime = Date.now();
        
        try {
            // Core System Tests
            await this.testSystemHealth();
            await this.testTradingStatus();
            await this.testCapitalAllocation();
            await this.testPositionLimits();
            
            // Market Data Tests
            await this.testMarketDataFeed();
            await this.testTradingOpportunities();
            
            // Risk Management Tests
            await this.testRiskManagement();
            
            // External API Tests
            await this.testBybitConnection();
            
            // Performance Tests
            await this.testTradingMetrics();
            await this.testConfigurationValues();
            
            // Load Tests
            await this.testStressLoad();
            await this.testErrorHandling();
            
        } catch (error) {
            this.log(`Test suite encountered error: ${error.message}`, 'ERROR');
        }
        
        const totalTime = Date.now() - startTime;
        
        // Generate test report
        this.generateReport(totalTime);
    }

    generateReport(totalTime) {
        this.log('=' * 80);
        this.log('📊 TEST SUITE RESULTS', 'REPORT');
        this.log('=' * 80);
        
        this.log(`Total Tests: ${this.totalTests}`);
        this.log(`Passed: ${this.passedTests}`);
        this.log(`Failed: ${this.failedTests}`);
        this.log(`Success Rate: ${((this.passedTests / this.totalTests) * 100).toFixed(2)}%`);
        this.log(`Total Time: ${totalTime}ms`);
        
        if (this.failedTests > 0) {
            this.log('\n❌ FAILED TESTS:', 'ERROR');
            this.testResults
                .filter(test => test.status === 'FAIL')
                .forEach(test => {
                    this.log(`  - ${test.name}: ${test.error}`, 'ERROR');
                });
        }
        
        if (this.passedTests === this.totalTests) {
            this.log('\n🎉 ALL TESTS PASSED! OMNI SYSTEM IS FULLY OPERATIONAL!', 'SUCCESS');
        } else {
            this.log('\n⚠️  SOME TESTS FAILED - SYSTEM NEEDS ATTENTION', 'WARNING');
        }
        
        // Save detailed report
        const reportPath = '/home/ubuntu/Sandeep/projects/omni/test-report.json';
        fs.writeFileSync(reportPath, JSON.stringify({
            summary: {
                totalTests: this.totalTests,
                passedTests: this.passedTests,
                failedTests: this.failedTests,
                successRate: (this.passedTests / this.totalTests) * 100,
                totalTime
            },
            results: this.testResults
        }, null, 2));
        
        this.log(`📄 Detailed report saved to: ${reportPath}`, 'INFO');
    }
}

// Run the test suite
if (require.main === module) {
    const testSuite = new OMNITestSuite();
    testSuite.runAllTests().catch(console.error);
}

module.exports = OMNITestSuite;
