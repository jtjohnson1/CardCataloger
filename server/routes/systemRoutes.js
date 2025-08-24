const express = require('express');
const router = express.Router();
const systemService = require('../services/systemService');

// GET /api/system/status - Get system health status
router.get('/status', async (req, res) => {
  try {
    console.log('System status endpoint called');
    
    const systemStatus = await systemService.getSystemStatus();
    
    res.json(systemStatus);
  } catch (error) {
    console.error('Error getting system status:', error.message);
    res.status(500).json({
      error: 'Failed to get system status',
      message: error.message
    });
  }
});

module.exports = router;