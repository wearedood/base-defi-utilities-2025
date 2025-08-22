src/error-handler.js
/**
 * Base DeFi Error Handler
 * Comprehensive error handling and logging for DeFi utilities
 * Optimized for Base blockchain ecosystem
 */

/**
 * Custom error classes for different types of DeFi operations
 */
class DeFiError extends Error {
    constructor(message, code, details = {}) {
        super(message);
        this.name = 'DeFiError';
        this.code = code;
        this.details = details;
        this.timestamp = new Date().toISOString();
        
        // Capture stack trace
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, DeFiError);
        }
    }
}

class ValidationError extends DeFiError {
    constructor(message, field, value) {
        super(message, 'VALIDATION_ERROR', { field, value });
        this.name = 'ValidationError';
    }
}

class NetworkError extends DeFiError {
    constructor(message, network, details = {}) {
        super(message, 'NETWORK_ERROR', { network, ...details });
        this.name = 'NetworkError';
    }
}

class PriceError extends DeFiError {
    constructor(message, asset, source, details = {}) {
        super(message, 'PRICE_ERROR', { asset, source, ...details });
        this.name = 'PriceError';
    }
}

class LiquidityError extends DeFiError {
    constructor(message, pool, details = {}) {
        super(message, 'LIQUIDITY_ERROR', { pool, ...details });
        this.name = 'LiquidityError';
    }
}

class CalculationError extends DeFiError {
    constructor(message, operation, inputs, details = {}) {
        super(message, 'CALCULATION_ERROR', { operation, inputs, ...details });
        this.name = 'CalculationError';
    }
}

class RiskError extends DeFiError {
    constructor(message, riskType, threshold, actual, details = {}) {
        super(message, 'RISK_ERROR', { riskType, threshold, actual, ...details });
        this.name = 'RiskError';
    }
}

/**
 * Error Handler Class
 * Centralized error handling, logging, and recovery
 */
class BaseErrorHandler {
    constructor(config = {}) {
        this.config = {
            logLevel: 'error', // 'debug', 'info', 'warn', 'error'
            enableConsoleLogging: true,
            enableFileLogging: false,
            maxRetries: 3,
            retryDelay: 1000, // milliseconds
            enableRecovery: true,
            enableMetrics: true,
            ...config
        };
        
        this.errorCounts = new Map();
        this.errorHistory = [];
        this.recoveryStrategies = new Map();
        
        this.setupDefaultRecoveryStrategies();
    }

    /**
     * Handle and process errors with automatic recovery
     * @param {Error} error - The error to handle
     * @param {Object} context - Additional context information
     * @returns {Object} Error handling result
     */
    async handleError(error, context = {}) {
        const errorInfo = this.processError(error, context);
        
        // Log the error
        this.logError(errorInfo);
        
        // Update metrics
        if (this.config.enableMetrics) {
            this.updateErrorMetrics(errorInfo);
        }
        
        // Attempt recovery if enabled
        let recoveryResult = null;
        if (this.config.enableRecovery) {
            recoveryResult = await this.attemptRecovery(errorInfo, context);
        }
        
        return {
            error: errorInfo,
            recovery: recoveryResult,
            handled: true,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Process and enrich error information
     * @param {Error} error - The error to process
     * @param {Object} context - Additional context
     * @returns {Object} Processed error information
     */
    processError(error, context) {
        const errorInfo = {
            id: this.generateErrorId(),
            name: error.name || 'UnknownError',
            message: error.message,
            code: error.code || 'UNKNOWN_ERROR',
            stack: error.stack,
            timestamp: new Date().toISOString(),
            context: context,
            severity: this.determineSeverity(error),
            category: this.categorizeError(error),
            details: error.details || {}
        };
        
        // Add additional context for DeFi-specific errors
        if (error instanceof DeFiError) {
            errorInfo.isDeFiError = true;
            errorInfo.defiDetails = error.details;
        }
        
        return errorInfo;
    }

    /**
     * Attempt to recover from errors using registered strategies
     * @param {Object} errorInfo - Processed error information
     * @param {Object} context - Original context
     * @returns {Object} Recovery result
     */
    async attemptRecovery(errorInfo, context) {
        const strategy = this.recoveryStrategies.get(errorInfo.code) || 
                        this.recoveryStrategies.get(errorInfo.category) ||
                        this.recoveryStrategies.get('default');
        
        if (!strategy) {
            return {
                attempted: false,
                reason: 'No recovery strategy available'
            };
        }
        
        try {
            const result = await strategy(errorInfo, context);
            return {
                attempted: true,
                successful: result.success,
                result: result,
                strategy: strategy.name || 'unknown'
            };
        } catch (recoveryError) {
            return {
                attempted: true,
                successful: false,
                error: recoveryError.message,
                strategy: strategy.name || 'unknown'
            };
        }
    }

    /**
     * Retry operation with exponential backoff
     * @param {Function} operation - Operation to retry
     * @param {Object} options - Retry options
     * @returns {Promise} Operation result
     */
    async retryOperation(operation, options = {}) {
        const {
            maxRetries = this.config.maxRetries,
            baseDelay = this.config.retryDelay,
            exponentialBackoff = true,
            retryCondition = (error) => true
        } = options;
        
        let lastError;
        
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                const result = await operation();
                
                if (attempt > 0) {
                    this.logInfo(`Operation succeeded after ${attempt} retries`);
                }
                
                return result;
            } catch (error) {
                lastError = error;
                
                if (attempt === maxRetries || !retryCondition(error)) {
                    break;
                }
                
                const delay = exponentialBackoff 
                    ? baseDelay * Math.pow(2, attempt)
                    : baseDelay;
                
                this.logWarn(`Operation failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms: ${error.message}`);
                
                await this.sleep(delay);
            }
        }
        
        throw new DeFiError(
            `Operation failed after ${maxRetries + 1} attempts: ${lastError.message}`,
            'RETRY_EXHAUSTED',
            { originalError: lastError, attempts: maxRetries + 1 }
        );
    }

    /**
     * Validate input parameters
     * @param {Object} params - Parameters to validate
     * @param {Object} schema - Validation schema
     * @throws {ValidationError} If validation fails
     */
    validateInput(params, schema) {
        const errors = [];
        
        Object.keys(schema).forEach(field => {
            const rules = schema[field];
            const value = params[field];
            
            // Required field check
            if (rules.required && (value === undefined || value === null)) {
                errors.push(`Field '${field}' is required`);
                return;
            }
            
            // Skip further validation if field is not provided and not required
            if (value === undefined || value === null) {
                return;
            }
            
            // Type validation
            if (rules.type && typeof value !== rules.type) {
                errors.push(`Field '${field}' must be of type ${rules.type}, got ${typeof value}`);
            }
            
            // Range validation for numbers
            if (rules.type === 'number') {
                if (rules.min !== undefined && value < rules.min) {
                    errors.push(`Field '${field}' must be >= ${rules.min}, got ${value}`);
                }
                if (rules.max !== undefined && value > rules.max) {
                    errors.push(`Field '${field}' must be <= ${rules.max}, got ${value}`);
                }
            }
            
            // String length validation
            if (rules.type === 'string') {
                if (rules.minLength !== undefined && value.length < rules.minLength) {
                    errors.push(`Field '${field}' must be at least ${rules.minLength} characters`);
                }
                if (rules.maxLength !== undefined && value.length > rules.maxLength) {
                    errors.push(`Field '${field}' must be at most ${rules.maxLength} characters`);
                }
            }
            
            // Custom validation
            if (rules.validate && typeof rules.validate === 'function') {
                const customResult = rules.validate(value);
                if (customResult !== true) {
                    errors.push(customResult || `Field '${field}' failed custom validation`);
                }
            }
        });
        
        if (errors.length > 0) {
            throw new ValidationError(
                `Validation failed: ${errors.join(', ')}`,
                Object.keys(schema),
                params
            );
        }
    }

    /**
     * Wrap async functions with error handling
     * @param {Function} fn - Function to wrap
     * @param {Object} options - Wrapping options
     * @returns {Function} Wrapped function
     */
    wrapAsync(fn, options = {}) {
        const { context = {}, enableRetry = false, retryOptions = {} } = options;
        
        return async (...args) => {
            try {
                const operation = () => fn.apply(this, args);
                
                if (enableRetry) {
                    return await this.retryOperation(operation, retryOptions);
                } else {
                    return await operation();
                }
            } catch (error) {
                const handlingResult = await this.handleError(error, {
                    ...context,
                    function: fn.name,
                    arguments: args
                });
                
                // Re-throw if recovery was not successful
                if (!handlingResult.recovery?.successful) {
                    throw error;
                }
                
                return handlingResult.recovery.result;
            }
        };
    }

    /**
     * Setup default recovery strategies
     */
    setupDefaultRecoveryStrategies() {
        // Network error recovery
        this.registerRecoveryStrategy('NETWORK_ERROR', async (errorInfo, context) => {
            // Wait and retry for network issues
            await this.sleep(2000);
            return { success: false, message: 'Network retry not implemented' };
        });
        
        // Price error recovery
        this.registerRecoveryStrategy('PRICE_ERROR', async (errorInfo, context) => {
            // Try alternative price sources
            return { success: false, message: 'Alternative price source not implemented' };
        });
        
        // Validation error recovery
        this.registerRecoveryStrategy('VALIDATION_ERROR', async (errorInfo, context) => {
            // Validation errors typically cannot be recovered automatically
            return { success: false, message: 'Validation errors require manual correction' };
        });
        
        // Default recovery strategy
        this.registerRecoveryStrategy('default', async (errorInfo, context) => {
            return { success: false, message: 'No specific recovery strategy available' };
        });
    }

    /**
     * Register a recovery strategy for specific error types
     * @param {string} errorType - Error type or code
     * @param {Function} strategy - Recovery strategy function
     */
    registerRecoveryStrategy(errorType, strategy) {
        this.recoveryStrategies.set(errorType, strategy);
    }

    /**
     * Log error with appropriate level
     * @param {Object} errorInfo - Error information
     */
    logError(errorInfo) {
        if (!this.config.enableConsoleLogging) return;
        
        const logMessage = `[${errorInfo.severity.toUpperCase()}] ${errorInfo.name}: ${errorInfo.message}`;
        
        switch (errorInfo.severity) {
            case 'critical':
            case 'high':
                console.error(logMessage, errorInfo);
                break;
            case 'medium':
                console.warn(logMessage, errorInfo);
                break;
            case 'low':
                console.info(logMessage, errorInfo);
                break;
            default:
                console.log(logMessage, errorInfo);
        }
    }

    // Helper methods
    
    generateErrorId() {
        return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    determineSeverity(error) {
        if (error instanceof ValidationError) return 'medium';
        if (error instanceof NetworkError) return 'high';
        if (error instanceof PriceError) return 'medium';
        if (error instanceof LiquidityError) return 'high';
        if (error instanceof CalculationError) return 'medium';
        if (error instanceof RiskError) return 'high';
        return 'medium';
    }
    
    categorizeError(error) {
        if (error instanceof ValidationError) return 'validation';
        if (error instanceof NetworkError) return 'network';
        if (error instanceof PriceError) return 'price';
        if (error instanceof LiquidityError) return 'liquidity';
        if (error instanceof CalculationError) return 'calculation';
        if (error instanceof RiskError) return 'risk';
        return 'unknown';
    }
    
    updateErrorMetrics(errorInfo) {
        const key = `${errorInfo.name}_${errorInfo.code}`;
        const count = this.errorCounts.get(key) || 0;
        this.errorCounts.set(key, count + 1);
        
        // Keep error history (last 100 errors)
        this.errorHistory.push(errorInfo);
        if (this.errorHistory.length > 100) {
            this.errorHistory.shift();
        }
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    logInfo(message) {
        if (this.config.enableConsoleLogging) {
            console.info(`[INFO] ${message}`);
        }
    }
    
    logWarn(message) {
        if (this.config.enableConsoleLogging) {
            console.warn(`[WARN] ${message}`);
        }
    }
    
    /**
     * Get error statistics
     * @returns {Object} Error statistics
     */
    getErrorStats() {
        return {
            totalErrors: this.errorHistory.length,
            errorCounts: Object.fromEntries(this.errorCounts),
            recentErrors: this.errorHistory.slice(-10),
            errorsByCategory: this.groupErrorsByCategory(),
            errorsBySeverity: this.groupErrorsBySeverity()
        };
    }
    
    groupErrorsByCategory() {
        const categories = {};
        this.errorHistory.forEach(error => {
            categories[error.category] = (categories[error.category] || 0) + 1;
        });
        return categories;
    }
    
    groupErrorsBySeverity() {
        const severities = {};
        this.errorHistory.forEach(error => {
            severities[error.severity] = (severities[error.severity] || 0) + 1;
        });
        return severities;
    }
}

// Export error classes and handler
module.exports = {
    BaseErrorHandler,
    DeFiError,
    ValidationError,
    NetworkError,
    PriceError,
    LiquidityError,
    CalculationError,
    RiskError
};
