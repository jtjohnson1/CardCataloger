const path = require('path');
const fs = require('fs');

// Load environment variables
require('dotenv').config();

console.log('Loading server configuration...');

// Configuration object
const config = {
  // Server configuration
  server: {
    port: process.env.PORT || 5000, // INPUT_REQUIRED {Server port number}
    host: process.env.HOST || 'localhost', // INPUT_REQUIRED {Server host address}
    environment: process.env.NODE_ENV || 'development'
  },

  // Database configuration
  database: {
    mongodb: {
      uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/cardmate', // INPUT_REQUIRED {MongoDB connection URI}
      options: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      }
    }
  },

  // File upload configuration
  upload: {
    maxFileSize: process.env.MAX_FILE_SIZE || '10mb',
    allowedImageTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    uploadDir: process.env.UPLOAD_DIR || path.join(__dirname, '../uploads'),
    tempDir: process.env.TEMP_DIR || path.join(__dirname, '../temp')
  },

  // AI/ML configuration
  ai: {
    ollamaUrl: process.env.OLLAMA_URL || 'http://localhost:11434', // INPUT_REQUIRED {Ollama server URL}
    defaultModel: process.env.AI_MODEL || 'llava:latest',
    timeout: parseInt(process.env.AI_TIMEOUT) || 30000,
    maxRetries: parseInt(process.env.AI_MAX_RETRIES) || 3
  },

  // Card processing configuration
  cardProcessing: {
    defaultConfidenceThreshold: parseFloat(process.env.CONFIDENCE_THRESHOLD) || 0.8,
    batchSize: parseInt(process.env.BATCH_SIZE) || 10,
    processingTimeout: parseInt(process.env.PROCESSING_TIMEOUT) || 60000
  },

  // Security configuration
  security: {
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000', // INPUT_REQUIRED {Frontend URL for CORS}
    jwtSecret: process.env.JWT_SECRET || 'your-jwt-secret-key', // INPUT_REQUIRED {JWT secret key}
    jwtExpiration: process.env.JWT_EXPIRATION || '24h',
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 900000, // 15 minutes
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX) || 100
  },

  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    enableFileLogging: process.env.ENABLE_FILE_LOGGING === 'true',
    logDir: process.env.LOG_DIR || path.join(__dirname, '../logs'),
    maxLogFiles: parseInt(process.env.MAX_LOG_FILES) || 5,
    maxLogSize: process.env.MAX_LOG_SIZE || '10m'
  },

  // External API configuration
  externalApis: {
    pricingApi: {
      url: process.env.PRICING_API_URL || '', // INPUT_REQUIRED {Card pricing API URL}
      apiKey: process.env.PRICING_API_KEY || '', // INPUT_REQUIRED {Card pricing API key}
      timeout: parseInt(process.env.PRICING_API_TIMEOUT) || 10000
    }
  }
};

// Validate required configuration
const validateConfig = () => {
  console.log('Validating server configuration...');
  
  const errors = [];

  // Check MongoDB URI
  if (!config.database.mongodb.uri || config.database.mongodb.uri === 'mongodb://localhost:27017/cardmate') {
    console.warn('Warning: Using default MongoDB URI. Please set MONGODB_URI environment variable.');
  }

  // Check Ollama URL
  if (!config.ai.ollamaUrl || config.ai.ollamaUrl === 'http://localhost:11434') {
    console.warn('Warning: Using default Ollama URL. Please set OLLAMA_URL environment variable.');
  }

  // Check JWT secret
  if (!config.security.jwtSecret || config.security.jwtSecret === 'your-jwt-secret-key') {
    console.warn('Warning: Using default JWT secret. Please set JWT_SECRET environment variable for production.');
  }

  // Create required directories
  try {
    const dirsToCreate = [
      config.upload.uploadDir,
      config.upload.tempDir,
      config.logging.logDir
    ];

    dirsToCreate.forEach(dir => {
      if (!fs.existsSync(dir)) {
        console.log(`Creating directory: ${dir}`);
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  } catch (error) {
    console.error('Error creating required directories:', error);
    errors.push(`Failed to create required directories: ${error.message}`);
  }

  if (errors.length > 0) {
    console.error('Configuration validation errors:');
    errors.forEach(error => console.error(`- ${error}`));
    throw new Error('Configuration validation failed');
  }

  console.log('Server configuration validated successfully');
};

// Initialize configuration
try {
  validateConfig();
  console.log('Configuration loaded successfully');
  console.log(`Server will run on: ${config.server.host}:${config.server.port}`);
  console.log(`Environment: ${config.server.environment}`);
  console.log(`MongoDB URI: ${config.database.mongodb.uri}`);
  console.log(`Ollama URL: ${config.ai.ollamaUrl}`);
  console.log(`Upload directory: ${config.upload.uploadDir}`);
} catch (error) {
  console.error('Failed to initialize configuration:', error);
  process.exit(1);
}

module.exports = config;