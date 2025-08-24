const mongoose = require('mongoose');
const axios = require('axios');

class SystemService {
  constructor() {
    // Use Docker service name when in Docker environment, localhost otherwise
    this.ollamaBaseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    this.isDevelopment = process.env.NODE_ENV !== 'production' && !process.env.DOCKER_CONTAINER;
    console.log(`SystemService initialized with Ollama URL: ${this.ollamaBaseUrl}`);
    console.log(`Running in ${this.isDevelopment ? 'development' : 'production'} mode`);
  }

  async checkDatabaseHealth() {
    try {
      console.log('Checking database health...');
      const startTime = Date.now();
      
      // Check if mongoose is connected
      if (mongoose.connection.readyState !== 1) {
        console.log('Database health check failed: Not connected');
        return { healthy: false, latency: null, error: 'Database not connected' };
      }

      // Perform a simple database operation to verify connectivity
      await mongoose.connection.db.admin().ping();
      
      const latency = Date.now() - startTime;
      console.log(`Database health check passed (${latency}ms)`);
      
      return { healthy: true, latency, error: null };
    } catch (error) {
      console.error('Database health check failed:', error.message);
      return { healthy: false, latency: null, error: error.message };
    }
  }

  async checkOllamaHealth() {
    try {
      console.log(`Checking Ollama health at ${this.ollamaBaseUrl}...`);
      const startTime = Date.now();
      
      // Make a simple request to Ollama API to check if it's running
      const response = await axios.get(`${this.ollamaBaseUrl}/api/tags`, {
        timeout: this.isDevelopment ? 5000 : 10000, // Shorter timeout in development
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const latency = Date.now() - startTime;
      
      if (response.status === 200) {
        console.log(`Ollama health check passed (${latency}ms)`);
        
        // Check if any models are available
        const models = response.data.models || [];
        const hasModels = models.length > 0;
        
        if (!hasModels) {
          console.warn('Ollama is running but no models are installed');
          return { 
            healthy: true, 
            latency, 
            error: null,
            warning: 'No models installed. Run setup script to install models.'
          };
        }
        
        return { healthy: true, latency, error: null, models: models.length };
      } else {
        console.log(`Ollama health check failed: Status ${response.status}`);
        return { healthy: false, latency, error: `Unexpected status: ${response.status}` };
      }
    } catch (error) {
      // In development mode, don't log connection errors as they're expected
      if (this.isDevelopment) {
        console.log('Ollama not available in development mode (this is normal)');
        return {
          healthy: false,
          latency: null,
          error: null, // No error in development mode
          warning: 'Ollama not installed (optional in development)',
          developmentNote: 'AI features disabled - install Ollama or use Docker for full functionality'
        };
      }

      // Only log actual errors in production
      console.error('Ollama health check failed:', error.message);

      // Provide more specific error messages for production/Docker environment
      let errorMessage = error.message;
      if (error.code === 'ECONNREFUSED') {
        errorMessage = `Ollama service is not running or not accessible at ${this.ollamaBaseUrl}`;
      } else if (error.code === 'ETIMEDOUT') {
        errorMessage = 'Ollama service timeout - may be starting up or overloaded';
      }
      
      return { healthy: false, latency: null, error: errorMessage };
    }
  }

  async getSystemStatus() {
    try {
      console.log('Getting system status...');
      
      // Run health checks in parallel
      const [databaseHealth, ollamaHealth] = await Promise.all([
        this.checkDatabaseHealth(),
        this.checkOllamaHealth()
      ]);

      // Determine overall status
      let overall = 'healthy';
      
      // In development mode, only require database to be healthy
      if (this.isDevelopment) {
        if (!databaseHealth.healthy) {
          overall = 'error';
        } else {
          // In development mode, if database is healthy, system is healthy
          // even without Ollama (since it's optional)
          overall = 'healthy';
        }
      } else {
        // In production/Docker mode, require both services
        if (!databaseHealth.healthy && !ollamaHealth.healthy) {
          overall = 'error';
        } else if (!databaseHealth.healthy || !ollamaHealth.healthy) {
          overall = 'warning';
        }
      }

      // Include Docker environment information
      const status = {
        overall,
        database: databaseHealth.healthy,
        ollama: ollamaHealth.healthy,
        details: {
          database: databaseHealth,
          ollama: ollamaHealth,
          environment: {
            nodeEnv: process.env.NODE_ENV || 'development',
            dockerized: !!process.env.DOCKER_CONTAINER || process.env.NODE_ENV === 'production',
            ollamaUrl: this.ollamaBaseUrl,
            developmentMode: this.isDevelopment
          }
        },
        timestamp: new Date().toISOString()
      };

      console.log(`System status check completed - Overall: ${overall} (Development mode: ${this.isDevelopment})`);
      return status;
    } catch (error) {
      console.error('System status check failed:', error.message);
      throw error;
    }
  }
}

module.exports = new SystemService();