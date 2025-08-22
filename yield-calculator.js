/**
 * Base DeFi Yield Calculator
 * Comprehensive yield farming and liquidity pool calculator for Base blockchain
 * Optimized for Base L2 gas efficiency and ecosystem protocols
 */

class BaseYieldCalculator {
    constructor() {
        this.baseRpcUrl = 'https://mainnet.base.org';
        this.protocols = {
            uniswap: { fee: 0.003, baseMultiplier: 1.2 },
            aerodrome: { fee: 0.002, baseMultiplier: 1.5 },
            baseswap: { fee: 0.0025, baseMultiplier: 1.3 }
        };
        this.gasOptimization = true;
    }

    /**
     * Calculate APY for liquidity pool positions
     * @param {number} principal - Initial investment amount
     * @param {number} dailyVolume - Daily trading volume
     * @param {string} protocol - Protocol name (uniswap, aerodrome, baseswap)
     * @param {number} poolTVL - Total Value Locked in pool
     * @returns {Object} Yield calculation results
     */
    calculateLPYield(principal, dailyVolume, protocol, poolTVL) {
        const protocolData = this.protocols[protocol];
        if (!protocolData) throw new Error('Unsupported protocol');

        const dailyFees = dailyVolume * protocolData.fee;
        const userShare = principal / poolTVL;
        const dailyEarnings = dailyFees * userShare;
        const baseBonus = dailyEarnings * protocolData.baseMultiplier;
        
        const annualEarnings = (dailyEarnings + baseBonus) * 365;
        const apy = (annualEarnings / principal) * 100;

        return {
            principal,
            dailyEarnings: dailyEarnings + baseBonus,
            monthlyEarnings: (dailyEarnings + baseBonus) * 30,
            annualEarnings,
            apy: apy.toFixed(2),
            protocol,
            baseOptimized: true
        };
    }

    /**
     * Calculate yield farming rewards with Base ecosystem bonuses
     * @param {number} stakedAmount - Amount staked in farming pool
     * @param {number} rewardRate - Annual reward rate (%)
     * @param {number} baseBonusMultiplier - Base ecosystem bonus multiplier
     * @returns {Object} Farming yield results
     */
    calculateFarmingYield(stakedAmount, rewardRate, baseBonusMultiplier = 1.1) {
        const baseReward = stakedAmount * (rewardRate / 100);
        const bonusReward = baseReward * (baseBonusMultiplier - 1);
        const totalAnnualReward = baseReward + bonusReward;

        return {
            stakedAmount,
            baseReward,
            bonusReward,
            totalAnnualReward,
            effectiveAPY: ((totalAnnualReward / stakedAmount) * 100).toFixed(2),
            dailyReward: (totalAnnualReward / 365).toFixed(6),
            monthlyReward: (totalAnnualReward / 12).toFixed(4)
        };
    }

    /**
     * Calculate impermanent loss for LP positions
     * @param {number} initialPrice - Initial token price ratio
     * @param {number} currentPrice - Current token price ratio
     * @returns {Object} Impermanent loss calculation
     */
    calculateImpermanentLoss(initialPrice, currentPrice) {
        const priceRatio = currentPrice / initialPrice;
        const impermanentLoss = (2 * Math.sqrt(priceRatio)) / (1 + priceRatio) - 1;
        const lossPercentage = Math.abs(impermanentLoss * 100);

        return {
            priceChange: ((priceRatio - 1) * 100).toFixed(2),
            impermanentLoss: (impermanentLoss * 100).toFixed(2),
            lossPercentage: lossPercentage.toFixed(2),
            recommendation: lossPercentage > 5 ? 'Consider rebalancing' : 'Position stable'
        };
    }

    /**
     * Optimize gas costs for Base L2 transactions
     * @param {number} transactionCount - Number of transactions
     * @param {number} baseGasPrice - Base gas price in gwei
     * @returns {Object} Gas optimization results
     */
    optimizeGasCosts(transactionCount, baseGasPrice = 0.1) {
        const l1GasEquivalent = baseGasPrice * 100; // L1 equivalent cost
        const baseSavings = l1GasEquivalent - baseGasPrice;
        const totalSavings = baseSavings * transactionCount;

        return {
            baseGasPrice,
            l1Equivalent: l1GasEquivalent,
            savingsPerTx: baseSavings.toFixed(4),
            totalSavings: totalSavings.toFixed(4),
            optimizationLevel: 'Base L2 Optimized'
        };
    }

    /**
     * Calculate compound yield with auto-compounding
     * @param {number} principal - Initial investment
     * @param {number} apy - Annual percentage yield
     * @param {number} compoundFrequency - Compounds per year
     * @param {number} years - Investment period in years
     * @returns {Object} Compound yield results
     */
    calculateCompoundYield(principal, apy, compoundFrequency = 365, years = 1) {
        const rate = apy / 100;
        const compoundAmount = principal * Math.pow(1 + rate / compoundFrequency, compoundFrequency * years);
        const totalGain = compoundAmount - principal;

        return {
            principal,
            finalAmount: compoundAmount.toFixed(2),
            totalGain: totalGain.toFixed(2),
            effectiveAPY: ((compoundAmount / principal - 1) * 100).toFixed(2),
            compoundFrequency,
            years
        };
    }

    /**
     * Generate comprehensive yield report
     * @param {Object} params - Calculation parameters
     * @returns {Object} Complete yield analysis
     */
    generateYieldReport(params) {
        const {
            principal,
            protocol,
            dailyVolume,
            poolTVL,
            stakingAPY,
            timeframe
        } = params;

        const lpYield = this.calculateLPYield(principal, dailyVolume, protocol, poolTVL);
        const farmingYield = this.calculateFarmingYield(principal, stakingAPY);
        const gasOptimization = this.optimizeGasCosts(30); // 30 transactions per month
        const compoundYield = this.calculateCompoundYield(principal, parseFloat(lpYield.apy));

        return {
            summary: {
                protocol,
                principal,
                timeframe,
                totalProjectedYield: (parseFloat(lpYield.apy) + parseFloat(farmingYield.effectiveAPY)).toFixed(2)
            },
            liquidityProvision: lpYield,
            yieldFarming: farmingYield,
            gasOptimization,
            compounding: compoundYield,
            recommendations: this.generateRecommendations(lpYield, farmingYield),
            timestamp: new Date().toISOString(),
            baseEcosystemOptimized: true
        };
    }

    /**
     * Generate investment recommendations
     * @param {Object} lpYield - LP yield data
     * @param {Object} farmingYield - Farming yield data
     * @returns {Array} Recommendations
     */
    generateRecommendations(lpYield, farmingYield) {
        const recommendations = [];
        
        if (parseFloat(lpYield.apy) > 20) {
            recommendations.push('High APY detected - consider impermanent loss risks');
        }
        
        if (parseFloat(farmingYield.effectiveAPY) > 15) {
            recommendations.push('Excellent farming opportunity - consider increasing stake');
        }
        
        recommendations.push('Base L2 provides significant gas savings for frequent transactions');
        recommendations.push('Consider auto-compounding for maximum yield optimization');
        
        return recommendations;
    }
}

// Export for use in Base dApps
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BaseYieldCalculator;
}

// Example usage for Base ecosystem
const calculator = new BaseYieldCalculator();

// Example: Calculate yield for Aerodrome LP position
const exampleYield = calculator.generateYieldReport({
    principal: 10000,
    protocol: 'aerodrome',
    dailyVolume: 500000,
    poolTVL: 2000000,
    stakingAPY: 25,
    timeframe: '1 year'
});

console.log('Base DeFi Yield Analysis:', exampleYield)

// Advanced DeFi Analytics and Risk Management

/**
 * Calculate Value at Risk (VaR) for DeFi positions
 * @param {Object} portfolio - Portfolio data
 * @param {number} confidenceLevel - Confidence level (e.g., 0.95 for 95%)
 * @param {number} timeHorizon - Time horizon in days
 * @returns {Object} VaR analysis
 */
BaseYieldCalculator.prototype.calculateVaR = function(portfolio, confidenceLevel = 0.95, timeHorizon = 1) {
    const positions = portfolio.positions || [];
    let totalValue = 0;
    let portfolioVolatility = 0;
    
    // Calculate portfolio value and weighted volatility
    positions.forEach(position => {
        const positionValue = position.amount * position.price;
        totalValue += positionValue;
        portfolioVolatility += Math.pow(position.volatility || 0.3, 2) * Math.pow(positionValue / totalValue, 2);
    });
    
    portfolioVolatility = Math.sqrt(portfolioVolatility);
    
    // Z-score for confidence level
    const zScore = confidenceLevel === 0.95 ? 1.645 : confidenceLevel === 0.99 ? 2.326 : 1.96;
    
    const dailyVaR = totalValue * portfolioVolatility * zScore;
    const periodVaR = dailyVaR * Math.sqrt(timeHorizon);
    
    return {
        totalValue: totalValue.toFixed(2),
        portfolioVolatility: (portfolioVolatility * 100).toFixed(2) + '%',
        dailyVaR: dailyVaR.toFixed(2),
        periodVaR: periodVaR.toFixed(2),
        confidenceLevel: (confidenceLevel * 100) + '%',
        timeHorizon: timeHorizon + ' days',
        riskLevel: dailyVaR / totalValue > 0.05 ? 'High' : dailyVaR / totalValue > 0.02 ? 'Medium' : 'Low'
    };
};

/**
 * Calculate Sharpe Ratio for DeFi strategies
 * @param {number} returns - Annual returns (%)
 * @param {number} riskFreeRate - Risk-free rate (%)
 * @param {number} volatility - Annual volatility (%)
 * @returns {Object} Sharpe ratio analysis
 */
BaseYieldCalculator.prototype.calculateSharpeRatio = function(returns, riskFreeRate = 2, volatility) {
    const excessReturn = returns - riskFreeRate;
    const sharpeRatio = excessReturn / volatility;
    
    let rating;
    if (sharpeRatio > 2) rating = 'Excellent';
    else if (sharpeRatio > 1) rating = 'Good';
    else if (sharpeRatio > 0.5) rating = 'Fair';
    else rating = 'Poor';
    
    return {
        sharpeRatio: sharpeRatio.toFixed(3),
        excessReturn: excessReturn.toFixed(2) + '%',
        volatility: volatility.toFixed(2) + '%',
        rating: rating,
        interpretation: this.getSharpeInterpretation(sharpeRatio)
    };
};

/**
 * Get Sharpe ratio interpretation
 * @param {number} ratio - Sharpe ratio
 * @returns {string} Interpretation
 */
BaseYieldCalculator.prototype.getSharpeInterpretation = function(ratio) {
    if (ratio > 2) return 'Outstanding risk-adjusted returns';
    if (ratio > 1) return 'Good risk-adjusted returns';
    if (ratio > 0.5) return 'Acceptable risk-adjusted returns';
    if (ratio > 0) return 'Below average risk-adjusted returns';
    return 'Poor risk-adjusted returns - consider alternatives';
};

/**
 * Calculate Maximum Drawdown for DeFi positions
 * @param {Array} priceHistory - Historical price data
 * @returns {Object} Drawdown analysis
 */
BaseYieldCalculator.prototype.calculateMaxDrawdown = function(priceHistory) {
    if (!priceHistory || priceHistory.length < 2) {
        return { maxDrawdown: 0, drawdownPeriod: 0, recovery: 'N/A' };
    }
    
    let peak = priceHistory[0];
    let maxDrawdown = 0;
    let drawdownStart = 0;
    let drawdownEnd = 0;
    let currentDrawdownStart = 0;
    
    for (let i = 1; i < priceHistory.length; i++) {
        if (priceHistory[i] > peak) {
            peak = priceHistory[i];
            currentDrawdownStart = i;
        } else {
            const drawdown = (peak - priceHistory[i]) / peak;
            if (drawdown > maxDrawdown) {
                maxDrawdown = drawdown;
                drawdownStart = currentDrawdownStart;
                drawdownEnd = i;
            }
        }
    }
    
    return {
        maxDrawdown: (maxDrawdown * 100).toFixed(2) + '%',
        drawdownPeriod: drawdownEnd - drawdownStart,
        peakValue: peak.toFixed(2),
        troughValue: priceHistory[drawdownEnd]?.toFixed(2) || 'N/A',
        recovery: maxDrawdown > 0 ? 'Monitoring required' : 'No significant drawdown'
    };
};

/**
 * Advanced yield farming strategy optimizer
 * @param {Array} strategies - Array of farming strategies
 * @param {Object} constraints - Investment constraints
 * @returns {Object} Optimized allocation
 */
BaseYieldCalculator.prototype.optimizeYieldStrategy = function(strategies, constraints = {}) {
    const {
        maxRisk = 0.3,
        minYield = 5,
        maxAllocationPerStrategy = 0.4,
        totalCapital = 100000
    } = constraints;
    
    // Filter strategies based on constraints
    const validStrategies = strategies.filter(strategy => 
        strategy.apy >= minYield && strategy.risk <= maxRisk
    );
    
    if (validStrategies.length === 0) {
        return { error: 'No strategies meet the specified constraints' };
    }
    
    // Calculate risk-adjusted returns (Sharpe-like metric)
    validStrategies.forEach(strategy => {
        strategy.riskAdjustedReturn = strategy.apy / (strategy.risk || 0.1);
        strategy.score = strategy.riskAdjustedReturn * (1 + strategy.liquidity / 100);
    });
    
    // Sort by score (highest first)
    validStrategies.sort((a, b) => b.score - a.score);
    
    // Allocate capital
    const allocations = [];
    let remainingCapital = totalCapital;
    let totalAllocatedRisk = 0;
    
    for (const strategy of validStrategies) {
        if (remainingCapital <= 0) break;
        
        const maxAllocation = Math.min(
            remainingCapital,
            totalCapital * maxAllocationPerStrategy,
            totalCapital * 0.8 // Reserve 20% for diversification
        );
        
        const allocation = Math.min(maxAllocation, remainingCapital * 0.3);
        
        if (allocation > 1000) { // Minimum allocation threshold
            allocations.push({
                strategy: strategy.name,
                allocation: allocation,
                percentage: (allocation / totalCapital * 100).toFixed(1) + '%',
                expectedReturn: (allocation * strategy.apy / 100).toFixed(2),
                risk: strategy.risk,
                apy: strategy.apy + '%'
            });
            
            remainingCapital -= allocation;
            totalAllocatedRisk += (allocation / totalCapital) * strategy.risk;
        }
    }
    
    // Calculate portfolio metrics
    const totalAllocated = totalCapital - remainingCapital;
    const weightedAPY = allocations.reduce((sum, alloc) => 
        sum + (parseFloat(alloc.expectedReturn) / totalAllocated * 100), 0
    );
    
    return {
        allocations: allocations,
        portfolioMetrics: {
            totalAllocated: totalAllocated.toFixed(2),
            remainingCash: remainingCapital.toFixed(2),
            weightedAPY: weightedAPY.toFixed(2) + '%',
            portfolioRisk: (totalAllocatedRisk * 100).toFixed(2) + '%',
            diversificationScore: allocations.length >= 3 ? 'Good' : 'Needs improvement',
            riskLevel: totalAllocatedRisk < 0.15 ? 'Conservative' : totalAllocatedRisk < 0.25 ? 'Moderate' : 'Aggressive'
        },
        recommendations: this.generatePortfolioRecommendations(allocations, totalAllocatedRisk)
    };
};

/**
 * Generate portfolio recommendations
 * @param {Array} allocations - Current allocations
 * @param {number} totalRisk - Total portfolio risk
 * @returns {Array} Recommendations
 */
BaseYieldCalculator.prototype.generatePortfolioRecommendations = function(allocations, totalRisk) {
    const recommendations = [];
    
    if (allocations.length < 3) {
        recommendations.push('Consider adding more strategies for better diversification');
    }
    
    if (totalRisk > 0.3) {
        recommendations.push('Portfolio risk is high - consider reducing exposure to volatile strategies');
    }
    
    if (totalRisk < 0.1) {
        recommendations.push('Portfolio is very conservative - consider adding moderate-risk strategies for higher returns');
    }
    
    const hasStablecoinStrategy = allocations.some(alloc => 
        alloc.strategy.toLowerCase().includes('stable') || 
        alloc.strategy.toLowerCase().includes('usdc') ||
        alloc.strategy.toLowerCase().includes('usdt')
    );
    
    if (!hasStablecoinStrategy) {
        recommendations.push('Consider adding stablecoin strategies for stability');
    }
    
    recommendations.push('Monitor gas costs and compound frequency for optimal returns');
    recommendations.push('Review and rebalance portfolio monthly based on market conditions');
    
    return recommendations;
};

/**
 * Calculate impermanent loss with advanced scenarios
 * @param {Object} poolData - Pool information
 * @param {Array} priceScenarios - Different price scenarios
 * @returns {Object} Comprehensive IL analysis
 */
BaseYieldCalculator.prototype.calculateAdvancedImpermanentLoss = function(poolData, priceScenarios = []) {
    const { token0Amount, token1Amount, token0Price, token1Price } = poolData;
    
    const initialValue = (token0Amount * token0Price) + (token1Amount * token1Price);
    const initialRatio = token0Price / token1Price;
    
    const scenarios = priceScenarios.length > 0 ? priceScenarios : [
        { name: 'Conservative', token0Change: 0.1, token1Change: -0.05 },
        { name: 'Moderate', token0Change: 0.25, token1Change: -0.15 },
        { name: 'Aggressive', token0Change: 0.5, token1Change: -0.3 },
        { name: 'Extreme', token0Change: 1.0, token1Change: -0.5 }
    ];
    
    const results = scenarios.map(scenario => {
        const newToken0Price = token0Price * (1 + scenario.token0Change);
        const newToken1Price = token1Price * (1 + scenario.token1Change);
        const newRatio = newToken0Price / newToken1Price;
        
        // Calculate impermanent loss
        const priceRatioChange = newRatio / initialRatio;
        const impermanentLoss = (2 * Math.sqrt(priceRatioChange)) / (1 + priceRatioChange) - 1;
        
        // Calculate new pool value
        const k = token0Amount * token1Amount; // Constant product
        const newToken0Amount = Math.sqrt(k * newRatio);
        const newToken1Amount = k / newToken0Amount;
        const poolValue = (newToken0Amount * newToken0Price) + (newToken1Amount * newToken1Price);
        
        // Calculate hold value
        const holdValue = (token0Amount * newToken0Price) + (token1Amount * newToken1Price);
        
        return {
            scenario: scenario.name,
            impermanentLoss: (Math.abs(impermanentLoss) * 100).toFixed(2) + '%',
            poolValue: poolValue.toFixed(2),
            holdValue: holdValue.toFixed(2),
            difference: (poolValue - holdValue).toFixed(2),
            token0Price: newToken0Price.toFixed(4),
            token1Price: newToken1Price.toFixed(4),
            severity: Math.abs(impermanentLoss) > 0.2 ? 'High' : Math.abs(impermanentLoss) > 0.1 ? 'Medium' : 'Low'
        };
    });
    
    return {
        initialValue: initialValue.toFixed(2),
        scenarios: results,
        riskAssessment: this.assessImpermanentLossRisk(results),
        mitigation: [
            'Monitor price correlation between tokens',
            'Consider single-sided staking for volatile pairs',
            'Use impermanent loss protection protocols',
            'Diversify across multiple pools',
            'Set stop-loss levels for extreme scenarios'
        ]
    };
};

/**
 * Assess impermanent loss risk
 * @param {Array} scenarios - IL scenarios
 * @returns {Object} Risk assessment
 */
BaseYieldCalculator.prototype.assessImpermanentLossRisk = function(scenarios) {
    const highRiskScenarios = scenarios.filter(s => s.severity === 'High').length;
    const mediumRiskScenarios = scenarios.filter(s => s.severity === 'Medium').length;
    
    let overallRisk;
    if (highRiskScenarios >= 2) overallRisk = 'High';
    else if (highRiskScenarios >= 1 || mediumRiskScenarios >= 2) overallRisk = 'Medium';
    else overallRisk = 'Low';
    
    return {
        overallRisk: overallRisk,
        highRiskScenarios: highRiskScenarios,
        mediumRiskScenarios: mediumRiskScenarios,
        recommendation: overallRisk === 'High' ? 
            'Consider alternative strategies or IL protection' :
            overallRisk === 'Medium' ? 
            'Monitor closely and consider hedging' :
            'Acceptable risk level for LP strategy'
    };
};;
