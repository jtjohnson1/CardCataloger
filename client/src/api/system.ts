import api from './api'

// Description: Get system status including database and Ollama connection
// Endpoint: GET /api/system/status
// Request: {}
// Response: { overall: string, database: boolean, ollama: boolean, details?: object, timestamp?: string }
export const getSystemStatus = async () => {
  // Mocking the response
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        overall: 'healthy',
        database: true,
        ollama: true,
        details: {
          database: {
            healthy: true,
            latency: 15,
            error: null
          },
          ollama: {
            healthy: true,
            latency: 250,
            error: null
          }
        },
        timestamp: new Date().toISOString()
      });
    }, 500);
  });
  // Uncomment the below lines to make an actual API call
  // try {
  //   const response = await api.get('/api/system/status')
  //   return response.data
  // } catch (error) {
  //   throw new Error(error?.response?.data?.message || error.message)
  // }
}