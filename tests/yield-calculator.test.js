/**
 * Test Suite for Base DeFi Yield Calculator
 * Comprehensive tests for yield calculation, risk analysis, and portfolio optimization
 */

const { expect } = require('chai');
const sinon = require('sinon');
const BaseYieldCalculator = require('../src/yield-calculator');

describe('BaseYieldCalculator', () => {
    let calculator;
    
    beforeEach(() => {
        calculator = new BaseYieldCalculator({
            defaultCompoundFrequency: 365,
            precision: 18,
            gasPrice: '0.1'
        });
    });
    
    afterEach(() => {
        sinon.restore();
    });

    describe('Constructor', () => {
        it('should initialize with default configuration', () => {
            const calc = new BaseYieldCalculator();
            expect(calc.config.defaultCompoundFrequency).to.equal(365);
            expect(calc.config.precision).to.equal(18);
        });
        
        it('should accept custom configuration', () => {
            const customConfig = {
                defaultCompoundFrequency: 12,
                precision: 6
            };
            const calc = new BaseYieldCalculator(customConfig);
            expect(calc.config.defaultCompoundFrequency).to.equal(12);
            expect(calc.config.precision).to.equal(6);
        });
    });

    describe('calculateAPY', () => {
        it('should calculate APY correctly for daily compounding', () => {
            const apy = calculator.calculateAPY(12, 365);
            expect(parseFloat(apy.toString())).to.be.closeTo(12.747, 0.001);
        });
        
        it('should calculate APY correctly for monthly compounding', () => {
            const apy = calculator.calculateAPY(12, 12);
            expect(parseFloat(apy.toString())).to.be.closeTo(12.683, 0.001);
        });
        
        it('should handle zero APR', () => {
            const apy = calculator.calculateAPY(0, 365);
            expect(parseFloat(apy.toString())).to.equal(0);
        });
        
        it('should throw error for negative APR', () => {
            expect(() => calculator.calculateAPY(-5, 365)).to.throw();
        });
    });

    describe('calculateFarmingYield', () => {
        const farmingParams = {
            principal: 10000,
            apr: 15,
            duration: 365,
            compoundFrequency: 365,
            fees: 50,
            impermanentLoss: 100
        };
        
        it('should calculate farming yield with all parameters', () => {
            const result = calculator.calculateFarmingYield(farmingParams);
            
            expect(result).to.have.property('principal');
            expect(result).to.have.property('grossYield');
            expect(result).to.have.property('netYield');
            expect(result).to.have.property('finalAmount');
            expect(result).to.have.property('effectiveAPY');
            
            expect(parseFloat(result.principal)).to.equal(10000);
            expect(parseFloat(result.grossYield)).to.be.greaterThan(1500);
            expect(parseFloat(result.netYield)).to.be.lessThan(parseFloat(result.grossYield));
        });
        
        it('should handle zero fees and impermanent loss', () => {
            const params = { ...farmingParams, fees: 0, impermanentLoss: 0 };
            const result = calculator.calculateFarmingYield(params);
            
            expect(parseFloat(result.grossYield)).to.equal(parseFloat(result.netYield));
        });
        
        it('should calculate correct duration impact', () => {
            const shortTerm = calculator.calculateFarmingYield({ ...farmingParams, duration: 30 });
            const longTerm = calculator.calculateFarmingYield({ ...farmingParams, duration: 730 });
            
            expect(parseFloat(longTerm.grossYield)).to.be.greaterThan(parseFloat(shortTerm.grossYield));
        });
    });

    describe('calculateOptimalCompounding', () => {
        it('should find optimal compounding frequency', () => {
            const result = calculator.calculateOptimalCompounding(20, 0.5, 5000);
            
            expect(result).to.have.property('optimalFrequency');
            expect(result).to.have.property('maxNetYield');
            expect(result).to.have.property('recommendedStrategy');
            
            expect(result.optimalFrequency).to.be.a('number');
            expect(result.optimalFrequency).to.be.greaterThan(0);
        });
        
        it('should prefer less frequent compounding for high gas costs', () => {
            const highGas = calculator.calculateOptimalCompounding(10, 50, 1000);
            const lowGas = calculator.calculateOptimalCompounding(10, 0.1, 1000);
            
            expect(highGas.optimalFrequency).to.be.lessThan(lowGas.optimalFrequency);
        });
    });

    describe('calculatePoolYield', () => {
        const poolData = {
            token0Amount: 1000,
            token1Amount: 2000,
            token0Price: 2500,
            token1Price: 1,
            poolFees: 0.003,
            tradingVolume: 100000,
            timeframe: 365
        };
        
        it('should calculate pool yield metrics', () => {
            const result = calculator.calculatePoolYield(poolData);
            
            expect(result).to.have.property('totalValue');
            expect(result).to.have.property('dailyFees');
            expect(result).to.have.property('annualFees');
            expect(result).to.have.property('feeAPY');
            expect(result).to.have.property('estimatedImpermanentLoss');
            
            expect(parseFloat(result.totalValue)).to.be.greaterThan(0);
            expect(parseFloat(result.feeAPY)).to.be.greaterThan(0);
        });
    });

    describe('calculateVaR', () => {
        const portfolio = {
            positions: [
                { amount: 1000, price: 2500, volatility: 0.3 },
                { amount: 2000, price: 1, volatility: 0.1 }
            ]
        };
        
        it('should calculate Value at Risk', () => {
            const result = calculator.calculateVaR(portfolio, 0.95, 1);
            
            expect(result).to.have.property('totalValue');
            expect(result).to.have.property('portfolioVolatility');
            expect(result).to.have.property('dailyVaR');
            expect(result).to.have.property('periodVaR');
            expect(result).to.have.property('riskLevel');
            
            expect(parseFloat(result.totalValue)).to.be.greaterThan(0);
            expect(['Low', 'Medium', 'High']).to.include(result.riskLevel);
        });
    });

    describe('calculateSharpeRatio', () => {
        it('should calculate Sharpe ratio correctly', () => {
            const result = calculator.calculateSharpeRatio(15, 2, 10);
            
            expect(result).to.have.property('sharpeRatio');
            expect(result).to.have.property('excessReturn');
            expect(result).to.have.property('volatility');
            expect(result).to.have.property('rating');
            
            expect(parseFloat(result.sharpeRatio)).to.equal(1.3);
            expect(result.rating).to.equal('Good');
        });
        
        it('should handle different risk-free rates', () => {
            const result1 = calculator.calculateSharpeRatio(10, 1, 5);
            const result2 = calculator.calculateSharpeRatio(10, 3, 5);
            
            expect(parseFloat(result1.sharpeRatio)).to.be.greaterThan(parseFloat(result2.sharpeRatio));
        });
    });

    describe('calculateMaxDrawdown', () => {
        it('should calculate maximum drawdown from price history', () => {
            const priceHistory = [100, 110, 105, 90, 95, 120, 80, 85];
            const result = calculator.calculateMaxDrawdown(priceHistory);
            
            expect(result).to.have.property('maxDrawdown');
            expect(result).to.have.property('drawdownPeriod');
            expect(result).to.have.property('peakValue');
            expect(result).to.have.property('recovery');
            
            expect(parseFloat(result.maxDrawdown)).to.be.greaterThan(0);
        });
        
        it('should handle empty price history', () => {
            const result = calculator.calculateMaxDrawdown([]);
            expect(result.maxDrawdown).to.equal(0);
        });
    });

    describe('optimizeYieldStrategy', () => {
        const strategies = [
            { name: 'Strategy A', apy: 12, risk: 0.2, liquidity: 80 },
            { name: 'Strategy B', apy: 18, risk: 0.4, liquidity: 60 },
            { name: 'Strategy C', apy: 8, risk: 0.1, liquidity: 95 }
        ];
        
        const constraints = {
            maxRisk: 0.3,
            minYield: 10,
            maxAllocationPerStrategy: 0.4,
            totalCapital: 100000
        };
        
        it('should optimize yield strategy allocation', () => {
            const result = calculator.optimizeYieldStrategy(strategies, constraints);
            
            expect(result).to.have.property('allocations');
            expect(result).to.have.property('portfolioMetrics');
            expect(result).to.have.property('recommendations');
            
            expect(result.allocations).to.be.an('array');
            expect(result.portfolioMetrics).to.have.property('weightedAPY');
        });
        
        it('should respect risk constraints', () => {
            const result = calculator.optimizeYieldStrategy(strategies, constraints);
            
            result.allocations.forEach(allocation => {
                expect(allocation.risk).to.be.at.most(constraints.maxRisk);
            });
        });
    });

    describe('calculateAdvancedImpermanentLoss', () => {
        const poolData = {
            token0Amount: 1000,
            token1Amount: 2000,
            token0Price: 2500,
            token1Price: 1
        };
        
        it('should calculate impermanent loss for different scenarios', () => {
            const result = calculator.calculateAdvancedImpermanentLoss(poolData);
            
            expect(result).to.have.property('initialValue');
            expect(result).to.have.property('scenarios');
            expect(result).to.have.property('riskAssessment');
            expect(result).to.have.property('mitigation');
            
            expect(result.scenarios).to.be.an('array');
            expect(result.scenarios.length).to.be.greaterThan(0);
        });
    });

    describe('Error Handling', () => {
        it('should handle invalid inputs gracefully', () => {
            expect(() => calculator.calculateAPY('invalid', 365)).to.throw();
            expect(() => calculator.calculateFarmingYield({})).to.throw();
        });
        
        it('should validate required parameters', () => {
            expect(() => calculator.calculateOptimalCompounding()).to.throw();
            expect(() => calculator.calculatePoolYield()).to.throw();
        });
    });

    describe('Integration Tests', () => {
        it('should work with real-world DeFi scenarios', () => {
            // Uniswap V3 ETH/USDC pool simulation
            const ethUsdcPool = {
                token0Amount: 100, // ETH
                token1Amount: 250000, // USDC
                token0Price: 2500,
                token1Price: 1,
                poolFees: 0.003,
                tradingVolume: 1000000
            };
            
            const poolYield = calculator.calculatePoolYield(ethUsdcPool);
            expect(parseFloat(poolYield.feeAPY)).to.be.greaterThan(0);
            
            // Yield farming scenario
            const farmingYield = calculator.calculateFarmingYield({
                principal: 50000,
                apr: 25,
                duration: 180,
                fees: 100
            });
            
            expect(parseFloat(farmingYield.netYield)).to.be.greaterThan(5000);
        });
    });
});
