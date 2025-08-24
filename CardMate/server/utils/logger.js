const fs = require('fs');
const path = require('path');

// Logger utility for CardMate application
class Logger {
  constructor() {
    this.logLevel = process.env.LOG_LEVEL || 'info';
    this.logLevels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    };
    
    // Create logs directory if it doesn't exist
    this.logsDir = path.join(__dirname, '../logs');
    if (!fs.existsSync(this.logsDir)) {
      try {
        fs.mkdirSync(this.logsDir, { recursive: true });
      } catch (error) {
        console.error('Failed to create logs directory:', error);
      }
    }
  }

  // Get current timestamp
  getTimestamp() {
    return new Date().toISOString();
  }

  // Format log message
  formatMessage(level, message, data = null) {
    const timestamp = this.getTimestamp();
    let formattedMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    
    if (data) {
      if (typeof data === 'object') {
        formattedMessage += '\n' + JSON.stringify(data, null, 2);
      } else {
        formattedMessage += ` ${data}`;
      }
    }
    
    return formattedMessage;
  }

  // Check if log level should be output
  shouldLog(level) {
    return this.logLevels[level] <= this.logLevels[this.logLevel];
  }

  // Write to log file
  writeToFile(level, message) {
    try {
      const logFile = path.join(this.logsDir, `${level}.log`);
      const timestamp = new Date().toISOString().split('T')[0];
      const logEntry = `${message}\n`;
      
      fs.appendFileSync(logFile, logEntry);
      
      // Also write to general log file
      const generalLogFile = path.join(this.logsDir, `app-${timestamp}.log`);
      fs.appendFileSync(generalLogFile, logEntry);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  // Error logging
  error(message, data = null) {
    if (!this.shouldLog('error')) return;
    
    const formattedMessage = this.formatMessage('error', message, data);
    console.error(formattedMessage);
    
    try {
      this.writeToFile('error', formattedMessage);
    } catch (writeError) {
      console.error('Failed to write error log:', writeError);
    }
  }

  // Warning logging
  warn(message, data = null) {
    if (!this.shouldLog('warn')) return;
    
    const formattedMessage = this.formatMessage('warn', message, data);
    console.warn(formattedMessage);
    
    try {
      this.writeToFile('warn', formattedMessage);
    } catch (writeError) {
      console.error('Failed to write warn log:', writeError);
    }
  }

  // Info logging
  info(message, data = null) {
    if (!this.shouldLog('info')) return;
    
    const formattedMessage = this.formatMessage('info', message, data);
    console.log(formattedMessage);
    
    try {
      this.writeToFile('info', formattedMessage);
    } catch (writeError) {
      console.error('Failed to write info log:', writeError);
    }
  }

  // Debug logging
  debug(message, data = null) {
    if (!this.shouldLog('debug')) return;
    
    const formattedMessage = this.formatMessage('debug', message, data);
    console.log(formattedMessage);
    
    try {
      this.writeToFile('debug', formattedMessage);
    } catch (writeError) {
      console.error('Failed to write debug log:', writeError);
    }
  }

  // Log directory scan operations
  logDirectoryScan(directory, includeSubdirectories, result) {
    try {
      this.info('Directory scan operation', {
        directory,
        includeSubdirectories,
        success: result.success,
        cardPairsFound: result.cardPairs ? result.cardPairs.length : 0,
        error: result.error || null
      });
    } catch (error) {
      this.error('Failed to log directory scan operation', error);
    }
  }

  // Log card processing operations
  logCardProcessing(cardId, operation, result) {
    try {
      this.info(`Card processing: ${operation}`, {
        cardId,
        operation,
        success: result.success,
        processingTime: result.processingTime || null,
        confidence: result.confidence || null,
        error: result.error || null
      });
    } catch (error) {
      this.error('Failed to log card processing operation', error);
    }
  }

  // Log API requests
  logApiRequest(method, url, statusCode, responseTime, error = null) {
    try {
      const logData = {
        method,
        url,
        statusCode,
        responseTime: `${responseTime}ms`,
        timestamp: this.getTimestamp()
      };

      if (error) {
        logData.error = error.message;
        logData.stack = error.stack;
        this.error(`API Request Failed: ${method} ${url}`, logData);
      } else {
        this.info(`API Request: ${method} ${url}`, logData);
      }
    } catch (logError) {
      this.error('Failed to log API request', logError);
    }
  }

  // Log database operations
  logDatabaseOperation(operation, collection, result, error = null) {
    try {
      const logData = {
        operation,
        collection,
        timestamp: this.getTimestamp()
      };

      if (error) {
        logData.error = error.message;
        logData.stack = error.stack;
        this.error(`Database operation failed: ${operation} on ${collection}`, logData);
      } else {
        if (result && typeof result === 'object') {
          logData.result = {
            modifiedCount: result.modifiedCount || null,
            insertedCount: result.insertedCount || null,
            deletedCount: result.deletedCount || null,
            matchedCount: result.matchedCount || null
          };
        }
        this.info(`Database operation: ${operation} on ${collection}`, logData);
      }
    } catch (logError) {
      this.error('Failed to log database operation', logError);
    }
  }

  // Log file operations
  logFileOperation(operation, filePath, success, error = null) {
    try {
      const logData = {
        operation,
        filePath,
        success,
        timestamp: this.getTimestamp()
      };

      if (error) {
        logData.error = error.message;
        logData.stack = error.stack;
        this.error(`File operation failed: ${operation}`, logData);
      } else {
        this.info(`File operation: ${operation}`, logData);
      }
    } catch (logError) {
      this.error('Failed to log file operation', logError);
    }
  }

  // Clean old log files (keep last 30 days)
  cleanOldLogs() {
    try {
      this.info('Starting log cleanup process');
      
      if (!fs.existsSync(this.logsDir)) {
        this.warn('Logs directory does not exist, skipping cleanup');
        return;
      }

      const files = fs.readdirSync(this.logsDir);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      let deletedCount = 0;

      files.forEach(file => {
        try {
          const filePath = path.join(this.logsDir, file);
          const stats = fs.statSync(filePath);
          
          if (stats.mtime < thirtyDaysAgo) {
            fs.unlinkSync(filePath);
            deletedCount++;
            this.debug(`Deleted old log file: ${file}`);
          }
        } catch (fileError) {
          this.error(`Failed to process log file ${file} during cleanup`, fileError);
        }
      });

      this.info(`Log cleanup completed. Deleted ${deletedCount} old log files`);
    } catch (error) {
      this.error('Failed to clean old logs', error);
    }
  }
}

// Create singleton instance
const logger = new Logger();

// Export the logger instance
module.exports = logger;