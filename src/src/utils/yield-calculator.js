/**
 * Enhanced Yield Calculator for Base DeFi Protocols
 * Supports multiple yield farming strategies and compound calculations
 */

const BigNumber = require('bignumber.js');
const { ethers } = require('ethers');

class YieldCalculator {
  constructor(config = {}) {
    this.config = {
      defaultCompoundFrequency: 365, // Daily compounding
      precision: 18,
      gasPrice: ethers.parseUnits('0.1', 'gwei'), // Base network gas
      ...config
    };
  }

  /**
   * Calculate Annual Percentage Yield (APY) with compounding
   * @param {number} apr - Annual Percentage Rate
   * @param {number} compoundFrequency - Times compounded per year
   * @returns {BigNumber} APY as percentage
   */
  calculateAPY(apr, compoundFrequency = this.config.defaultCompoundFrequency) {
    const aprDecimal = new BigNumber(apr).dividedBy(100);
    const compoundRate = aprDecimal.dividedBy(compoundFrequency);
    const apy = compoundRate.plus(1).pow(compoundFrequency).minus(1);
    return apy.multipliedBy(100);
  }

  /**
   * Calculate yield farming rewards over time
   * @param {Object} params - Farming parameters
   * @returns {Object} Detailed yield calculations
   */
  calculateFarmingYield(params) {
    const {
      principal,
      apr,
      duration, // in days
      compoundFrequency = 365,
      fees = 0,
      impermanentLoss = 0
    } = params;

    const principalBN = new BigNumber(principal);
    const aprBN = new BigNumber(apr).dividedBy(100);
    const durationYears = new BigNumber(duration).dividedBy(365);
    
    // Calculate compound interest
    const compoundRate = aprBN.dividedBy(compoundFrequency);
    const periods = compoundFrequency * durationYears.toNumber();
    const finalAmount = principalBN.multipliedBy(
      compoundRate.plus(1).pow(periods)
    );

    const grossYield = finalAmount.minus(principalBN);
    const netYield = grossYield.minus(fees).minus(impermanentLoss);
    const effectiveAPY = this.calculateAPY(apr, compoundFrequency);

    return {
      principal: principalBN.toString(),
      grossYield: grossYield.toString(),
      netYield: netYield.toString(),
      finalAmount: finalAmount.toString(),
      effectiveAPY: effectiveAPY.toString(),
      fees: fees.toString(),
      impermanentLoss: impermanentLoss.toString(),
      duration: duration
    };
  }

  /**
   * Calculate optimal compound frequency
   * @param {number} apr - Annual Percentage Rate
   * @param {number} gasCost - Cost per compound transaction
   * @param {number} principal - Principal amount
   * @returns {Object} Optimal compounding strategy
   */
  calculateOptimalCompounding(apr, gasCost, principal) {
    const frequencies = [1, 4, 12, 52, 365]; // Yearly, Quarterly, Monthly, Weekly, Daily
    let optimalFreq = 1;
    let maxNetYield = new BigNumber(0);

    frequencies.forEach(freq => {
      const apy = this.calculateAPY(apr, freq);
      const grossYield = new BigNumber(principal)
        .multipliedBy(apy.dividedBy(100));
      const totalGasCost = new BigNumber(gasCost).multipliedBy(freq);
      const netYield = grossYield.minus(totalGasCost);

      if (netYield.isGreaterThan(maxNetYield)) {
        maxNetYield = netYield;
        optimalFreq = freq;
      }
    });

    return {
      optimalFrequency: optimalFreq,
      maxNetYield: maxNetYield.toString(),
      recommendedStrategy: this.getCompoundingStrategy(optimalFreq)
    };
  }

  /**
   * Calculate liquidity pool yield with impermanent loss
   * @param {Object} poolData - Pool information
   * @returns {Object} Pool yield analysis
   */
  calculatePoolYield(poolData) {
    const {
      token0Amount,
      token1Amount,
      token0Price,
      token1Price,
      poolFees,
      tradingVolume,
      timeframe = 365 // days
    } = poolData;

    const totalValue = new BigNumber(token0Amount)
      .multipliedBy(token0Price)
      .plus(new BigNumber(token1Amount).multipliedBy(token1Price));

    const dailyFees = new BigNumber(tradingVolume)
      .multipliedBy(poolFees)
      .dividedBy(365);

    const annualFees = dailyFees.multipliedBy(365);
    const feeAPY = annualFees.dividedBy(totalValue).multipliedBy(100);

    return {
      totalValue: totalValue.toString(),
      dailyFees: dailyFees.toString(),
      annualFees: annualFees.toString(),
      feeAPY: feeAPY.toString(),
      estimatedImpermanentLoss: this.estimateImpermanentLoss(poolData)
    };
  }

  /**
   * Estimate impermanent loss for a liquidity pool
   * @param {Object} poolData - Pool data with price changes
   * @returns {string} Estimated impermanent loss percentage
   */
  estimateImpermanentLoss(poolData) {
    const { priceRatio } = poolData;
    if (!priceRatio) return '0';

    const ratio = new BigNumber(priceRatio);
    const impermanentLoss = new BigNumber(2)
      .multipliedBy(ratio.sqrt())
      .dividedBy(ratio.plus(1))
      .minus(1)
      .abs()
      .multipliedBy(100);

    return impermanentLoss.toString();
  }

  /**
   * Get compounding strategy description
   * @param {number} frequency - Compound frequency
   * @returns {string} Strategy description
   */
  getCompoundingStrategy(frequency) {
    const strategies = {
      1: 'Annual compounding - Low gas, lower yield',
      4: 'Quarterly compounding - Balanced approach',
      12: 'Monthly compounding - Good for medium amounts',
      52: 'Weekly compounding - Higher gas, better yield',
      365: 'Daily compounding - Highest gas, maximum yield'
    };
    return strategies[frequency] || 'Custom frequency';
  }
}

module.exports = YieldCalculator;
