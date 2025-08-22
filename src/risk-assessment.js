/**
 * Base DeFi Risk Assessment Utility
 * Comprehensive risk analysis tools for DeFi protocols and strategies
 * Optimized for Base blockchain ecosystem
 */

const BigNumber = require('bignumber.js');
const { ethers } = require('ethers');

/**
 * Base Risk Assessment Class
 * Provides comprehensive risk analysis for DeFi investments
 */
class BaseRiskAssessment {
    constructor(config = {}) {
        this.config = {
            riskFreeRate: 0.02, // 2% annual risk-free rate
            volatilityPeriod: 30, // 30 days for volatility calculation
            confidenceLevel: 0.95, // 95% confidence level for VaR
            maxDrawdownThreshold: 0.2, // 20% max drawdown threshold
            liquidityThreshold: 100000, // $100k minimum liquidity
            ...config
        };
        
        this.riskFactors = {
            smart_contract: { weight: 0.25, description: 'Smart contract vulnerabilities' },
            liquidity: { weight: 0.20, description: 'Liquidity and market depth risks' },
            volatility: { weight: 0.15, description: 'Price volatility and market risk' },
            regulatory: { weight: 0.10, description: 'Regulatory and compliance risks' },
            operational: { weight: 0.10, description: 'Operational and technical risks' },
            counterparty: { weight: 0.10, description: 'Counterparty and protocol risks' },
            concentration: { weight: 0.10, description: 'Concentration and correlation risks' }
        };
    }

    /**
     * Comprehensive portfolio risk assessment
     * @param {Object} portfolio - Portfolio data
     * @param {Object} marketData - Market conditions
     * @returns {Object} Complete risk analysis
     */
    assessPortfolioRisk(portfolio, marketData = {}) {
        const riskMetrics = {
            overall: this.calculateOverallRisk(portfolio),
            var: this.calculatePortfolioVaR(portfolio),
            sharpe: this.calculateSharpeRatio(portfolio),
            maxDrawdown: this.calculateMaxDrawdown(portfolio),
            beta: this.calculateBeta(portfolio, marketData),
            concentration: this.calculateConcentrationRisk(portfolio),
            liquidity: this.assessLiquidityRisk(portfolio),
            correlation: this.calculateCorrelationRisk(portfolio)
        };

        const riskFactorAnalysis = this.analyzeRiskFactors(portfolio);
        const stressTestResults = this.performStressTests(portfolio);
        const recommendations = this.generateRiskRecommendations(riskMetrics, riskFactorAnalysis);

        return {
            summary: {
                riskLevel: this.determineRiskLevel(riskMetrics),
                riskScore: this.calculateRiskScore(riskMetrics),
                confidence: this.calculateConfidence(riskMetrics)
            },
            metrics: riskMetrics,
            factors: riskFactorAnalysis,
            stressTests: stressTestResults,
            recommendations: recommendations,
            monitoring: this.createMonitoringPlan(portfolio, riskMetrics)
        };
    }

    /**
     * Calculate Value at Risk (VaR) for portfolio
     * @param {Object} portfolio - Portfolio data
     * @param {number} timeHorizon - Time horizon in days
     * @returns {Object} VaR analysis
     */
    calculatePortfolioVaR(portfolio, timeHorizon = 1) {
        const positions = portfolio.positions || [];
        let portfolioValue = 0;
        let portfolioVariance = 0;
        
        // Calculate portfolio value and variance
        positions.forEach(position => {
            const positionValue = position.amount * position.price;
            portfolioValue += positionValue;
            
            const weight = positionValue / portfolioValue;
            const volatility = position.volatility || 0.3; // Default 30% annual volatility
            portfolioVariance += Math.pow(weight * volatility, 2);
        });
        
        // Add correlation effects
        for (let i = 0; i < positions.length; i++) {
            for (let j = i + 1; j < positions.length; j++) {
                const weight_i = (positions[i].amount * positions[i].price) / portfolioValue;
                const weight_j = (positions[j].amount * positions[j].price) / portfolioValue;
                const vol_i = positions[i].volatility || 0.3;
                const vol_j = positions[j].volatility || 0.3;
                const correlation = this.getAssetCorrelation(positions[i].asset, positions[j].asset);
                
                portfolioVariance += 2 * weight_i * weight_j * vol_i * vol_j * correlation;
            }
        }
        
        const portfolioVolatility = Math.sqrt(portfolioVariance);
        const dailyVolatility = portfolioVolatility / Math.sqrt(365);
        const periodVolatility = dailyVolatility * Math.sqrt(timeHorizon);
        
        // Calculate VaR at different confidence levels
        const zScores = { 90: 1.282, 95: 1.645, 99: 2.326 };
        const varResults = {};
        
        Object.keys(zScores).forEach(confidence => {
            const zScore = zScores[confidence];
            const var_amount = portfolioValue * periodVolatility * zScore;
            varResults[confidence + '%'] = {
                amount: var_amount.toFixed(2),
                percentage: ((var_amount / portfolioValue) * 100).toFixed(2) + '%'
            };
        });
        
        return {
            portfolioValue: portfolioValue.toFixed(2),
            volatility: (portfolioVolatility * 100).toFixed(2) + '%',
            timeHorizon: timeHorizon + ' days',
            var: varResults,
            interpretation: this.interpretVaR(varResults['95%'].percentage)
        };
    }

    /**
     * Assess smart contract risks
     * @param {Object} protocol - Protocol information
     * @returns {Object} Smart contract risk analysis
     */
    assessSmartContractRisk(protocol) {
        const riskFactors = {
            auditStatus: this.evaluateAuditStatus(protocol.audits || []),
            codeComplexity: this.evaluateCodeComplexity(protocol.codeMetrics || {}),
            upgradeability: this.evaluateUpgradeRisk(protocol.upgradePattern || 'none'),
            timeInProduction: this.evaluateMaturityRisk(protocol.deploymentDate),
            tvlRisk: this.evaluateTVLRisk(protocol.tvl || 0),
            governanceRisk: this.evaluateGovernanceRisk(protocol.governance || {})
        };

        const overallScore = this.calculateWeightedRiskScore(riskFactors);
        
        return {
            score: overallScore,
            level: this.getRiskLevel(overallScore),
            factors: riskFactors,
            recommendations: this.generateSmartContractRecommendations(riskFactors),
            monitoring: {
                auditSchedule: 'Quarterly review recommended',
                codeChanges: 'Monitor for significant updates',
                governanceChanges: 'Track governance proposals'
            }
        };
    }

    /**
     * Perform comprehensive stress testing
     * @param {Object} portfolio - Portfolio data
     * @returns {Object} Stress test results
     */
    performStressTests(portfolio) {
        const scenarios = [
            { name: 'Market Crash', marketDrop: -0.5, volatilityIncrease: 2.0 },
            { name: 'Flash Crash', marketDrop: -0.3, volatilityIncrease: 5.0 },
            { name: 'Liquidity Crisis', marketDrop: -0.2, liquidityDrop: -0.8 },
            { name: 'Regulatory Shock', marketDrop: -0.4, regulatoryImpact: -0.6 },
            { name: 'Protocol Hack', protocolRisk: -0.9, contagionEffect: -0.3 },
            { name: 'Base Network Issues', networkRisk: -0.7, gasSpike: 10.0 }
        ];

        const results = scenarios.map(scenario => {
            const impact = this.calculateScenarioImpact(portfolio, scenario);
            return {
                scenario: scenario.name,
                portfolioImpact: impact.portfolioChange,
                worstAsset: impact.worstPerformer,
                recoveryTime: impact.estimatedRecovery,
                mitigationStrategies: this.suggestMitigation(scenario, impact)
            };
        });

        return {
            scenarios: results,
            worstCase: results.reduce((worst, current) => 
                current.portfolioImpact < worst.portfolioImpact ? current : worst
            ),
            averageImpact: results.reduce((sum, r) => sum + r.portfolioImpact, 0) / results.length,
            resilience: this.calculateResilienceScore(results)
        };
    }

    /**
     * Calculate liquidity risk assessment
     * @param {Object} portfolio - Portfolio data
     * @returns {Object} Liquidity risk analysis
     */
    assessLiquidityRisk(portfolio) {
        const positions = portfolio.positions || [];
        let totalValue = 0;
        let liquidityScore = 0;
        
        const liquidityAnalysis = positions.map(position => {
            const positionValue = position.amount * position.price;
            totalValue += positionValue;
            
            const liquidityMetrics = {
                dailyVolume: position.dailyVolume || 0,
                marketCap: position.marketCap || 0,
                bidAskSpread: position.bidAskSpread || 0.01,
                marketDepth: position.marketDepth || 0
            };
            
            const liquidityRating = this.calculateLiquidityRating(liquidityMetrics, positionValue);
            liquidityScore += liquidityRating.score * (positionValue / totalValue);
            
            return {
                asset: position.asset,
                value: positionValue,
                liquidityRating: liquidityRating,
                timeToLiquidate: this.estimateLiquidationTime(liquidityMetrics, positionValue),
                slippageEstimate: this.estimateSlippage(liquidityMetrics, positionValue)
            };
        });
        
        return {
            overallScore: liquidityScore,
            riskLevel: this.getLiquidityRiskLevel(liquidityScore),
            positions: liquidityAnalysis,
            recommendations: this.generateLiquidityRecommendations(liquidityAnalysis),
            emergencyPlan: this.createEmergencyLiquidationPlan(liquidityAnalysis)
        };
    }

    /**
     * Calculate correlation risk between assets
     * @param {Object} portfolio - Portfolio data
     * @returns {Object} Correlation analysis
     */
    calculateCorrelationRisk(portfolio) {
        const positions = portfolio.positions || [];
        const correlationMatrix = {};
        let maxCorrelation = 0;
        let avgCorrelation = 0;
        let correlationCount = 0;
        
        // Build correlation matrix
        for (let i = 0; i < positions.length; i++) {
            for (let j = i + 1; j < positions.length; j++) {
                const asset1 = positions[i].asset;
                const asset2 = positions[j].asset;
                const correlation = this.getAssetCorrelation(asset1, asset2);
                
                if (!correlationMatrix[asset1]) correlationMatrix[asset1] = {};
                correlationMatrix[asset1][asset2] = correlation;
                
                maxCorrelation = Math.max(maxCorrelation, Math.abs(correlation));
                avgCorrelation += Math.abs(correlation);
                correlationCount++;
            }
        }
        
        avgCorrelation = correlationCount > 0 ? avgCorrelation / correlationCount : 0;
        
        // Calculate diversification ratio
        const diversificationRatio = this.calculateDiversificationRatio(portfolio);
        
        return {
            maxCorrelation: maxCorrelation.toFixed(3),
            averageCorrelation: avgCorrelation.toFixed(3),
            diversificationRatio: diversificationRatio.toFixed(3),
            correlationMatrix: correlationMatrix,
            riskLevel: this.getCorrelationRiskLevel(maxCorrelation, avgCorrelation),
            recommendations: this.generateCorrelationRecommendations(maxCorrelation, avgCorrelation)
        };
    }

    /**
     * Generate risk-based recommendations
     * @param {Object} riskMetrics - Risk analysis results
     * @param {Object} riskFactors - Risk factor analysis
     * @returns {Array} Recommendations
     */
    generateRiskRecommendations(riskMetrics, riskFactors) {
        const recommendations = [];
        
        // VaR-based recommendations
        if (parseFloat(riskMetrics.var.var['95%'].percentage) > 10) {
            recommendations.push({
                priority: 'High',
                category: 'Risk Reduction',
                recommendation: 'Portfolio VaR exceeds 10% - consider reducing position sizes or adding hedging',
                action: 'Reduce high-risk positions by 20-30%'
            });
        }
        
        // Concentration risk recommendations
        if (riskMetrics.concentration.score > 0.7) {
            recommendations.push({
                priority: 'Medium',
                category: 'Diversification',
                recommendation: 'High concentration risk detected - diversify across more assets',
                action: 'Add 2-3 uncorrelated assets to portfolio'
            });
        }
        
        // Liquidity recommendations
        if (riskMetrics.liquidity.overallScore < 0.5) {
            recommendations.push({
                priority: 'High',
                category: 'Liquidity',
                recommendation: 'Low liquidity detected - maintain higher cash reserves',
                action: 'Keep 15-20% in highly liquid assets'
            });
        }
        
        // Smart contract recommendations
        Object.keys(riskFactors).forEach(factor => {
            if (riskFactors[factor].score > 0.8) {
                recommendations.push({
                    priority: 'High',
                    category: 'Protocol Risk',
                    recommendation: `High ${factor} risk - consider reducing exposure`,
                    action: `Review and potentially exit ${factor} positions`
                });
            }
        });
        
        return recommendations.sort((a, b) => {
            const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
    }

    /**
     * Create monitoring plan for ongoing risk management
     * @param {Object} portfolio - Portfolio data
     * @param {Object} riskMetrics - Risk metrics
     * @returns {Object} Monitoring plan
     */
    createMonitoringPlan(portfolio, riskMetrics) {
        return {
            daily: [
                'Monitor portfolio VaR and volatility',
                'Check liquidity conditions for major positions',
                'Review gas costs and network congestion'
            ],
            weekly: [
                'Recalculate correlation matrix',
                'Assess smart contract risk factors',
                'Review yield farming performance vs risk'
            ],
            monthly: [
                'Comprehensive portfolio risk assessment',
                'Stress test portfolio against new scenarios',
                'Review and update risk parameters'
            ],
            alerts: {
                varThreshold: '15%',
                liquidityThreshold: '0.3',
                correlationThreshold: '0.8',
                volatilityThreshold: '50%'
            },
            rebalancingTriggers: [
                'VaR exceeds 15% of portfolio value',
                'Single position exceeds 25% allocation',
                'Correlation between major positions > 0.8',
                'Liquidity score drops below 0.4'
            ]
        };
    }

    // Helper methods for risk calculations
    
    calculateOverallRisk(portfolio) {
        // Simplified overall risk calculation
        const var95 = parseFloat(this.calculatePortfolioVaR(portfolio).var['95%'].percentage);
        const liquidityScore = this.assessLiquidityRisk(portfolio).overallScore;
        const concentrationRisk = this.calculateConcentrationRisk(portfolio).score;
        
        return {
            score: (var95 / 100 + (1 - liquidityScore) + concentrationRisk) / 3,
            components: { var95, liquidityScore, concentrationRisk }
        };
    }
    
    calculateConcentrationRisk(portfolio) {
        const positions = portfolio.positions || [];
        const totalValue = positions.reduce((sum, pos) => sum + (pos.amount * pos.price), 0);
        
        let herfindahlIndex = 0;
        positions.forEach(position => {
            const weight = (position.amount * position.price) / totalValue;
            herfindahlIndex += weight * weight;
        });
        
        return {
            score: herfindahlIndex,
            level: herfindahlIndex > 0.5 ? 'High' : herfindahlIndex > 0.25 ? 'Medium' : 'Low',
            recommendation: herfindahlIndex > 0.5 ? 'Diversify portfolio' : 'Concentration acceptable'
        };
    }
    
    getAssetCorrelation(asset1, asset2) {
        // Simplified correlation - in practice, use historical price data
        const correlations = {
            'ETH-BTC': 0.7,
            'USDC-USDT': 0.95,
            'ETH-USDC': 0.1,
            'BTC-USDC': 0.05
        };
        
        const key = `${asset1}-${asset2}`;
        const reverseKey = `${asset2}-${asset1}`;
        
        return correlations[key] || correlations[reverseKey] || 0.3; // Default moderate correlation
    }
    
    getRiskLevel(score) {
        if (score > 0.7) return 'High';
        if (score > 0.4) return 'Medium';
        return 'Low';
    }
    
    interpretVaR(varPercentage) {
        const var_num = parseFloat(varPercentage);
        if (var_num > 15) return 'Very High Risk - Consider significant position reduction';
        if (var_num > 10) return 'High Risk - Monitor closely and consider hedging';
        if (var_num > 5) return 'Moderate Risk - Acceptable for most investors';
        return 'Low Risk - Conservative portfolio';
    }
}

module.exports = BaseRiskAssessment;
