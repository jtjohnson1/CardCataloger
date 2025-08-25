const express = require('express');
const router = express.Router();
const cardService = require('../services/cardService');
const priceService = require('../services/priceService');
const path = require('path');

// Store scanned results temporarily (in production, use Redis or database)
const scanResults = new Map();

// Create a new card manually
router.post('/', async (req, res) => {
  try {
    const cardData = req.body;
    console.log('POST /api/cards - Received request body:', JSON.stringify(cardData, null, 2));

    console.log('API: Creating new card manually');

    const card = await cardService.createCard(cardData);
    console.log('Card created successfully in route:', card);

    res.status(201).json({
      success: true,
      message: 'Card created successfully',
      card
    });
  } catch (error) {
    console.error('Error in create card endpoint:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      error: error.message || 'Failed to create card'
    });
  }
});

// Serve images from scanned directories
router.get('/image/*', (req, res) => {
  try {
    // Extract the file path from the URL
    const filePath = req.params[0];
    const decodedPath = decodeURIComponent(filePath);

    console.log(`Serving image: ${decodedPath}`);

    // Security check - ensure the path doesn't contain directory traversal
    if (decodedPath.includes('..')) {
      return res.status(400).json({ error: 'Invalid file path' });
    }

    // Send the file
    res.sendFile(path.resolve(decodedPath), (err) => {
      if (err) {
        console.error('Error serving image:', err);
        res.status(404).json({ error: 'Image not found' });
      }
    });
  } catch (error) {
    console.error('Error in image serving endpoint:', error);
    res.status(500).json({ error: 'Failed to serve image' });
  }
});

// Scan directory for card files
router.post('/scan-directory', async (req, res) => {
  try {
    const { directory, includeSubdirectories } = req.body;

    if (!directory) {
      return res.status(400).json({
        error: 'Directory path is required'
      });
    }

    console.log(`API: Scanning directory ${directory}, recursive: ${includeSubdirectories}`);

    const result = await cardService.scanDirectory(directory, includeSubdirectories);

    // Convert file paths to HTTP URLs
    const cardsWithUrls = result.cards.map(card => ({
      ...card,
      frontImage: card.frontImage ? `/api/cards/image/${encodeURIComponent(card.frontImage)}` : card.frontImage,
      backImage: card.backImage ? `/api/cards/image/${encodeURIComponent(card.backImage)}` : card.backImage
    }));

    // Store results for later processing
    const scanId = Date.now().toString();
    scanResults.set(scanId, result.cards); // Store original paths for processing

    // Add scanId to response for reference
    const response = {
      ...result,
      cards: cardsWithUrls,
      scanId
    };

    res.json(response);
  } catch (error) {
    console.error('Error in scan-directory endpoint:', error);
    res.status(500).json({
      error: error.message || 'Failed to scan directory'
    });
  }
});

// Process selected cards
router.post('/process', async (req, res) => {
  try {
    const { directory, includeSubdirectories, selectedCards } = req.body;

    if (!directory) {
      return res.status(400).json({
        error: 'Directory path is required'
      });
    }

    if (!selectedCards || !Array.isArray(selectedCards) || selectedCards.length === 0) {
      return res.status(400).json({
        error: 'Selected cards array is required and must not be empty'
      });
    }

    console.log(`API: Processing ${selectedCards.length} cards from directory ${directory}`);

    // For this implementation, we need to re-scan to get the card data
    // In production, you might want to store this in a more persistent way
    const scanResult = await cardService.scanDirectory(directory, includeSubdirectories);

    const result = await cardService.processCards(
      directory,
      includeSubdirectories,
      selectedCards,
      scanResult.cards
    );

    res.json(result);
  } catch (error) {
    console.error('Error in process endpoint:', error);
    res.status(500).json({
      error: error.message || 'Failed to start card processing'
    });
  }
});

// Get processing progress
router.get('/progress/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;

    if (!jobId) {
      return res.status(400).json({
        error: 'Job ID is required'
      });
    }

    console.log(`API: Getting progress for job ${jobId}`);

    const progress = await cardService.getProcessingProgress(jobId);
    res.json(progress);
  } catch (error) {
    console.error('Error in progress endpoint:', error);

    if (error.message === 'Job not found') {
      return res.status(404).json({
        error: 'Processing job not found'
      });
    }

    res.status(500).json({
      error: error.message || 'Failed to get processing progress'
    });
  }
});

// Get all cards
router.get('/', async (req, res) => {
  try {
    console.log('GET /api/cards - Getting all cards');
    const cards = await cardService.getAllCards();
    console.log(`GET /api/cards - Found ${cards.length} cards`);
    res.json({ cards });
  } catch (error) {
    console.error('Error in get cards endpoint:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      error: error.message || 'Failed to get cards'
    });
  }
});

// Get card by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`GET /api/cards/${id} - Getting card by ID`);

    const card = await cardService.getCardById(id);
    console.log(`GET /api/cards/${id} - Found card:`, card.name);
    res.json({ card });
  } catch (error) {
    console.error('Error in get card by ID endpoint:', error);
    console.error('Error stack:', error.stack);

    if (error.message === 'Card not found') {
      return res.status(404).json({
        error: 'Card not found'
      });
    }

    res.status(500).json({
      error: error.message || 'Failed to get card'
    });
  }
});

// Get price comparison for a card
router.get('/:id/price-comparison', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`GET /api/cards/${id}/price-comparison - Getting price comparison`);

    // First get the card details
    const card = await cardService.getCardById(id);
    console.log(`Price comparison for card: ${card.name}`);

    // Get price comparison data
    const priceComparison = await priceService.getPriceComparison(card);
    console.log(`Price comparison completed - Average: $${priceComparison.averagePrice}`);

    res.json(priceComparison);
  } catch (error) {
    console.error('Error in price comparison endpoint:', error);
    console.error('Error stack:', error.stack);

    if (error.message === 'Card not found') {
      return res.status(404).json({
        error: 'Card not found'
      });
    }

    res.status(500).json({
      error: error.message || 'Failed to get price comparison'
    });
  }
});

// Delete cards
router.delete('/', async (req, res) => {
  try {
    const { cardIds } = req.body;

    if (!cardIds || !Array.isArray(cardIds) || cardIds.length === 0) {
      return res.status(400).json({
        error: 'Card IDs array is required and must not be empty'
      });
    }

    console.log(`API: Deleting ${cardIds.length} cards`);

    const result = await cardService.deleteCards(cardIds);
    res.json(result);
  } catch (error) {
    console.error('Error in delete cards endpoint:', error);
    res.status(500).json({
      error: error.message || 'Failed to delete cards'
    });
  }
});

module.exports = router;