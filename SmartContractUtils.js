/**
 * Smart Contract Utilities for Base DeFi Protocols
 * Provides comprehensive contract interaction and management tools
 */

const { ethers } = require('ethers');
const { Contract, Interface } = ethers;

class SmartContractUtils {
  constructor(config = {}) {
    this.config = {
      rpcUrl: config.rpcUrl || 'https://mainnet.base.org',
      chainId: 8453, // Base mainnet
      gasLimit: config.gasLimit || 500000,
      maxFeePerGas: config.maxFeePerGas || ethers.parseUnits('2', 'gwei'),
      maxPriorityFeePerGas: config.maxPriorityFeePerGas || ethers.parseUnits('1', 'gwei'),
      ...config
    };
    
    this.provider = new ethers.JsonRpcProvider(this.config.rpcUrl);
    this.contracts = new Map();
    this.abis = new Map();
  }

  /**
   * Register a contract ABI for future use
   * @param {string} name - Contract identifier
   * @param {Array} abi - Contract ABI
   * @param {string} address - Contract address
   */
  registerContract(name, abi, address) {
    this.abis.set(name, abi);
    const contract = new Contract(address, abi, this.provider);
    this.contracts.set(name, contract);
    return contract;
  }

  /**
   * Get a registered contract instance
   * @param {string} name - Contract identifier
   * @returns {Contract} Contract instance
   */
  getContract(name) {
    const contract = this.contracts.get(name);
    if (!contract) {
      throw new Error(`Contract '${name}' not registered`);
    }
    return contract;
  }

  /**
   * Connect a signer to a contract for transactions
   * @param {string} contractName - Contract identifier
   * @param {Signer} signer - Ethereum signer
   * @returns {Contract} Contract with signer
   */
  connectSigner(contractName, signer) {
    const contract = this.getContract(contractName);
    return contract.connect(signer);
  }

  /**
   * Estimate gas for a contract transaction
   * @param {string} contractName - Contract identifier
   * @param {string} methodName - Method to call
   * @param {Array} params - Method parameters
   * @param {Object} overrides - Transaction overrides
   * @returns {Promise<bigint>} Estimated gas
   */
  async estimateGas(contractName, methodName, params = [], overrides = {}) {
    try {
      const contract = this.getContract(contractName);
      const gasEstimate = await contract[methodName].estimateGas(...params, overrides);
      
      // Add 20% buffer for safety
      return gasEstimate * 120n / 100n;
    } catch (error) {
      throw new Error(`Gas estimation failed: ${error.message}`);
    }
  }

  /**
   * Execute a read-only contract call
   * @param {string} contractName - Contract identifier
   * @param {string} methodName - Method to call
   * @param {Array} params - Method parameters
   * @returns {Promise<any>} Call result
   */
  async call(contractName, methodName, params = []) {
    try {
      const contract = this.getContract(contractName);
      return await contract[methodName](...params);
    } catch (error) {
      throw new Error(`Contract call failed: ${error.message}`);
    }
  }

  /**
   * Execute a contract transaction
   * @param {string} contractName - Contract identifier
   * @param {string} methodName - Method to call
   * @param {Array} params - Method parameters
   * @param {Signer} signer - Transaction signer
   * @param {Object} options - Transaction options
   * @returns {Promise<Object>} Transaction result
   */
  async executeTransaction(contractName, methodName, params = [], signer, options = {}) {
    try {
      const contract = this.connectSigner(contractName, signer);
      
      // Estimate gas if not provided
      if (!options.gasLimit) {
        options.gasLimit = await this.estimateGas(contractName, methodName, params, options);
      }
      
      // Set default gas prices for Base
      const txOptions = {
        maxFeePerGas: this.config.maxFeePerGas,
        maxPriorityFeePerGas: this.config.maxPriorityFeePerGas,
        ...options
      };
      
      const tx = await contract[methodName](...params, txOptions);
      const receipt = await tx.wait();
      
      return {
        hash: tx.hash,
        receipt,
        gasUsed: receipt.gasUsed,
        effectiveGasPrice: receipt.effectiveGasPrice,
        status: receipt.status
      };
    } catch (error) {
      throw new Error(`Transaction failed: ${error.message}`);
    }
  }

  /**
   * Batch multiple contract calls
   * @param {Array} calls - Array of call objects
   * @returns {Promise<Array>} Array of results
   */
  async batchCalls(calls) {
    const promises = calls.map(async (call) => {
      try {
        const result = await this.call(call.contract, call.method, call.params);
        return { success: true, result, call };
      } catch (error) {
        return { success: false, error: error.message, call };
      }
    });
    
    return Promise.all(promises);
  }

  /**
   * Monitor contract events
   * @param {string} contractName - Contract identifier
   * @param {string} eventName - Event name
   * @param {Function} callback - Event callback
   * @param {Object} filter - Event filter
   * @returns {Function} Cleanup function
   */
  monitorEvents(contractName, eventName, callback, filter = {}) {
    const contract = this.getContract(contractName);
    const eventFilter = contract.filters[eventName](...Object.values(filter));
    
    contract.on(eventFilter, callback);
    
    // Return cleanup function
    return () => contract.off(eventFilter, callback);
  }

  /**
   * Get historical events
   * @param {string} contractName - Contract identifier
   * @param {string} eventName - Event name
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Event logs
   */
  async getEvents(contractName, eventName, options = {}) {
    try {
      const contract = this.getContract(contractName);
      const filter = contract.filters[eventName]();
      
      const events = await contract.queryFilter(
        filter,
        options.fromBlock || -10000, // Last ~10k blocks
        options.toBlock || 'latest'
      );
      
      return events.map(event => ({
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash,
        args: event.args,
        event: event.event,
        address: event.address
      }));
    } catch (error) {
      throw new Error(`Event query failed: ${error.message}`);
    }
  }

  /**
   * Decode transaction data
   * @param {string} contractName - Contract identifier
   * @param {string} data - Transaction data
   * @returns {Object} Decoded transaction
   */
  decodeTransaction(contractName, data) {
    try {
      const abi = this.abis.get(contractName);
      if (!abi) {
        throw new Error(`ABI for contract '${contractName}' not found`);
      }
      
      const iface = new Interface(abi);
      return iface.parseTransaction({ data });
    } catch (error) {
      throw new Error(`Transaction decode failed: ${error.message}`);
    }
  }

  /**
   * Get contract storage at specific slot
   * @param {string} address - Contract address
   * @param {string} slot - Storage slot
   * @param {string|number} blockTag - Block number or tag
   * @returns {Promise<string>} Storage value
   */
  async getStorageAt(address, slot, blockTag = 'latest') {
    try {
      return await this.provider.getStorage(address, slot, blockTag);
    } catch (error) {
      throw new Error(`Storage read failed: ${error.message}`);
    }
  }

  /**
   * Check if address is a contract
   * @param {string} address - Address to check
   * @returns {Promise<boolean>} True if contract
   */
  async isContract(address) {
    try {
      const code = await this.provider.getCode(address);
      return code !== '0x';
    } catch (error) {
      return false;
    }
  }

  /**
   * Get current gas prices for Base network
   * @returns {Promise<Object>} Gas price information
   */
  async getGasPrices() {
    try {
      const feeData = await this.provider.getFeeData();
      return {
        gasPrice: feeData.gasPrice,
        maxFeePerGas: feeData.maxFeePerGas,
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas
      };
    } catch (error) {
      throw new Error(`Gas price fetch failed: ${error.message}`);
    }
  }

  /**
   * Simulate a transaction without executing it
   * @param {Object} transaction - Transaction object
   * @returns {Promise<Object>} Simulation result
   */
  async simulateTransaction(transaction) {
    try {
      const result = await this.provider.call(transaction);
      return {
        success: true,
        returnData: result,
        gasUsed: await this.provider.estimateGas(transaction)
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        reason: error.reason || 'Unknown error'
      };
    }
  }
}

module.exports = SmartContractUtils;      
