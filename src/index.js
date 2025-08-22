/**
 * Base DeFi Utilities 2025
 * Main entry point for the utility library
 */

// Core utility modules
const YieldCalculator = require('./utils/yield-calculator');
const LiquidityAnalyzer = require('./utils/liquidity-analyzer');
const TradingOptimizer = require('./utils/trading-optimizer');
const RiskAssessment = require('./utils/risk-assessment');
const PortfolioTracker = require('./utils/portfolio-tracker');

// Base network specific modules
const BaseConnector = require('./base/base-connector');
const GasOptimizer = require('./base/gas-optimizer');
const DexAggregator = require('./base/dex-aggregator');

// Export all utilities
module.exports = {
  // Core utilities
  YieldCalculator,
  LiquidityAnalyzer,
  TradingOptimizer,
  RiskAssessment,
  PortfolioTracker,
  
  // Base network utilities
  BaseConnector,
  GasOptimizer,
  DexAggregator,
  
  // Convenience methods
  createYieldCalculator: (config) => new YieldCalculator(config),
  createLiquidityAnalyzer: (config) => new LiquidityAnalyzer(config),
  createTradingOptimizer: (config) => new TradingOptimizer(config),
  createRiskAssessment: (config) => new RiskAssessment(config),
  createPortfolioTracker: (config) => new PortfolioTracker(config),
  
  // Version info
  version: require('../package.json').version
};

// Default export for ES6 modules
module.exports.default = module.exports;
