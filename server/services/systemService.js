const mongoose = require('mongoose');
const axios = require('axios');

class SystemService {
  constructor() {
    // Use environment variable for Ollama URL, with Docker-aware default
    this.ollamaBaseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    console.log(`SystemService initialized with Ollama URL: ${this.ollamaBaseUrl}`);
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
        timeout: 10000, // 10 second timeout for Docker environment
        headers: {
          'Accept': 'application/json'
        }
      });
      
      const latency = Date.now() - startTime;
      
      if (response.status === 200) {
        console.log(`Ollama health check passed (${latency}ms)`);
        return { healthy: true, latency, error: null };
      } else {
        console.log(`Ollama health check failed: Status ${response.status}`);
        return { healthy: false, latency, error: `Unexpected status: ${response.status}` };
      }
    } catch (error) {
      console.error('Ollama health check failed:', error.message);
      
      // Provide more specific error messages for Docker environment
      let errorMessage = error.message;
      if (error.code === 'ECONNREFUSED') {
        errorMessage = 'Connection refused - Ollama service may not be running';
      } else if (error.code === 'ETIMEDOUT') {
        errorMessage = 'Connection timeout - Ollama service may be starting up';
      } else if (error.code === 'ENOTFOUND') {
        errorMessage = 'Host not found - Check Ollama service configuration';
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
      if (!databaseHealth.healthy && !ollamaHealth.healthy) {
        overall = 'error';
      } else if (!databaseHealth.healthy || !ollamaHealth.healthy) {
        overall = 'warning';
      }

      const status = {
        overall,
        database: databaseHealth.healthy,
        ollama: ollamaHealth.healthy,
        details: {
          database: databaseHealth,
          ollama: ollamaHealth
        },
        timestamp: new Date().toISOString()
      };

      console.log(`System status check completed - Overall: ${overall}, DB: ${databaseHealth.healthy}, Ollama: ${ollamaHealth.healthy}`);
      return status;
    } catch (error) {
      console.error('System status check failed:', error.message);
      throw error;
    }
  }
}

module.exports = new SystemService();