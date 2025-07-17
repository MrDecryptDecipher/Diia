#!/usr/bin/env node

/**
 * POSITION LIMIT TESTING SCRIPT
 * Tests the position counter and limits thoroughly
 */

const axios = require('axios');

class PositionLimitTester {
    constructor() {
        this.baseUrl = 'http://localhost:10002';
    }

    log(message, type = 'INFO') {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] ${type}: ${message}`);
    }

    async getCurrentPositions() {
        try {
            const response = await axios.get(`${this.baseUrl}/api/trading/positions`);
            return response.data;
        } catch (error) {
            this.log(`Error getting positions: ${error.message}`, 'ERROR');
            return null;
        }
    }

    async getSystemConfig() {
        try {
            const response = await axios.get(`${this.baseUrl}/api/config`);
            return response.data;
        } catch (error) {
            this.log(`Error getting config: ${error.message}`, 'ERROR');
            return null;
        }
    }

    async testPositionCounter() {
        this.log('🧪 Testing Position Counter Logic', 'TEST');
        
        const positions = await this.getCurrentPositions();
        if (!positions) return false;
        
        this.log(`Current open positions: ${positions.openPositions || 0}`);
        this.log(`Max concurrent positions: ${positions.maxPositions || 'unknown'}`);
        this.log(`Position limit reached: ${positions.limitReached || false}`);
        
        // Verify the position counter is working
        if (typeof positions.openPositions !== 'number') {
            this.log('❌ Position counter is not a number', 'ERROR');
            return false;
        }
        
        if (positions.openPositions < 0) {
            this.log('❌ Position counter is negative', 'ERROR');
            return false;
        }
        
        if (positions.maxPositions !== 50) {
            this.log(`❌ Max positions should be 50, got ${positions.maxPositions}`, 'ERROR');
            return false;
        }
        
        this.log('✅ Position counter logic is working correctly', 'SUCCESS');
        return true;
    }

    async testConfigurationValues() {
        this.log('🧪 Testing Configuration Values', 'TEST');
        
        const config = await this.getSystemConfig();
        if (!config) return false;
        
        const expectedValues = {
            maxConcurrentPositions: 50,
            maxPositions: 50,
            totalCapital: 12
        };
        
        let allCorrect = true;
        
        for (const [key, expectedValue] of Object.entries(expectedValues)) {
            const actualValue = config[key];
            if (actualValue !== expectedValue) {
                this.log(`❌ Config ${key}: expected ${expectedValue}, got ${actualValue}`, 'ERROR');
                allCorrect = false;
            } else {
                this.log(`✅ Config ${key}: ${actualValue} (correct)`, 'SUCCESS');
            }
        }
        
        return allCorrect;
    }

    async monitorPositionChanges(duration = 30000) {
        this.log(`🧪 Monitoring position changes for ${duration/1000} seconds`, 'TEST');
        
        const startTime = Date.now();
        let lastPositionCount = -1;
        let changeCount = 0;
        
        while (Date.now() - startTime < duration) {
            const positions = await this.getCurrentPositions();
            if (positions && positions.openPositions !== lastPositionCount) {
                if (lastPositionCount !== -1) {
                    changeCount++;
                    this.log(`Position count changed: ${lastPositionCount} → ${positions.openPositions}`, 'INFO');
                }
                lastPositionCount = positions.openPositions;
            }
            
            await new Promise(resolve => setTimeout(resolve, 2000)); // Check every 2 seconds
        }
        
        this.log(`Position monitoring complete. Detected ${changeCount} changes`, 'INFO');
        return changeCount > 0;
    }

    async testCapitalAllocation() {
        this.log('🧪 Testing Capital Allocation Logic', 'TEST');
        
        try {
            const response = await axios.get(`${this.baseUrl}/api/trading/capital`);
            const capital = response.data;
            
            this.log(`Total Capital: ${capital.totalCapital} USDT`);
            this.log(`Available Capital: ${capital.availableCapital} USDT`);
            this.log(`Allocated Capital: ${capital.allocatedCapital} USDT`);
            
            // Verify capital logic
            if (capital.totalCapital !== 12) {
                this.log(`❌ Total capital should be 12 USDT, got ${capital.totalCapital}`, 'ERROR');
                return false;
            }
            
            if (capital.availableCapital < 0) {
                this.log(`❌ Available capital cannot be negative: ${capital.availableCapital}`, 'ERROR');
                return false;
            }
            
            if (capital.allocatedCapital < 0) {
                this.log(`❌ Allocated capital cannot be negative: ${capital.allocatedCapital}`, 'ERROR');
                return false;
            }
            
            const sum = capital.availableCapital + capital.allocatedCapital;
            if (Math.abs(sum - capital.totalCapital) > 0.01) {
                this.log(`❌ Capital allocation doesn't add up: ${sum} ≠ ${capital.totalCapital}`, 'ERROR');
                return false;
            }
            
            this.log('✅ Capital allocation logic is working correctly', 'SUCCESS');
            return true;
            
        } catch (error) {
            this.log(`❌ Error testing capital allocation: ${error.message}`, 'ERROR');
            return false;
        }
    }

    async testTradingActivity() {
        this.log('🧪 Testing Trading Activity', 'TEST');
        
        try {
            const response = await axios.get(`${this.baseUrl}/api/trading/metrics`);
            const metrics = response.data;
            
            this.log(`Total Trades: ${metrics.totalTrades || 0}`);
            this.log(`Win Rate: ${metrics.winRate || 0}%`);
            this.log(`Daily Trades: ${metrics.dailyTrades || 0}`);
            
            if (metrics.totalTrades > 0) {
                this.log('✅ System is actively trading', 'SUCCESS');
                return true;
            } else {
                this.log('⚠️  No trades detected yet', 'WARNING');
                return false;
            }
            
        } catch (error) {
            this.log(`❌ Error testing trading activity: ${error.message}`, 'ERROR');
            return false;
        }
    }

    async runAllTests() {
        this.log('🚀 Starting Position Limit Test Suite', 'START');
        this.log('=' * 60);
        
        const tests = [
            { name: 'Position Counter', test: () => this.testPositionCounter() },
            { name: 'Configuration Values', test: () => this.testConfigurationValues() },
            { name: 'Capital Allocation', test: () => this.testCapitalAllocation() },
            { name: 'Trading Activity', test: () => this.testTradingActivity() },
            { name: 'Position Monitoring', test: () => this.monitorPositionChanges(15000) }
        ];
        
        let passedTests = 0;
        const totalTests = tests.length;
        
        for (const { name, test } of tests) {
            try {
                this.log(`\n🧪 Running: ${name}`, 'TEST');
                const result = await test();
                if (result) {
                    passedTests++;
                    this.log(`✅ ${name}: PASSED`, 'PASS');
                } else {
                    this.log(`❌ ${name}: FAILED`, 'FAIL');
                }
            } catch (error) {
                this.log(`❌ ${name}: ERROR - ${error.message}`, 'ERROR');
            }
        }
        
        this.log('\n' + '=' * 60);
        this.log('📊 POSITION LIMIT TEST RESULTS', 'REPORT');
        this.log('=' * 60);
        this.log(`Passed: ${passedTests}/${totalTests}`);
        this.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(2)}%`);
        
        if (passedTests === totalTests) {
            this.log('\n🎉 ALL POSITION LIMIT TESTS PASSED!', 'SUCCESS');
        } else {
            this.log('\n⚠️  SOME TESTS FAILED - CHECK SYSTEM CONFIGURATION', 'WARNING');
        }
    }
}

// Run the position limit tests
if (require.main === module) {
    const tester = new PositionLimitTester();
    tester.runAllTests().catch(console.error);
}

module.exports = PositionLimitTester;
