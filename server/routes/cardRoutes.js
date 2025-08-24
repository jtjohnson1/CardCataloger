const express = require('express');
const router = express.Router();
const CardService = require('../services/cardService');
const PriceService = require('../services/priceService');
const path = require('path');
const fs = require('fs');

// Get all cards
router.get('/', async (req, res) => {
  try {
    console.log('GET /api/cards - Getting all cards');
    const cards = await CardService.getAllCards();
    console.log(`GET /api/cards - Found ${cards.length} cards`);
    res.json({ cards });
  } catch (error) {
    console.error('Error getting cards:', error);
    res.status(500).json({ error: error.message });
  }
});

// Scan directory for card files
router.post('/scan', async (req, res) => {
  try {
    console.log('POST /api/cards/scan - Scanning directory');
    const { directory, includeSubdirectories } = req.body;

    console.log(`Scanning directory: ${directory}, includeSubdirectories: ${includeSubdirectories}`);

    if (!directory) {
      return res.status(400).json({
        success: false,
        message: 'Directory path is required'
      });
    }

    const scanResult = await CardService.scanDirectory(directory, includeSubdirectories);
    console.log(`Scan completed - Found ${scanResult.validPairs.length} pairs, ${scanResult.singleCards.length} single cards`);

    res.json({
      success: true,
      data: scanResult
    });
  } catch (error) {
    console.error('Error scanning directory:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Process selected cards
router.post('/process', async (req, res) => {
  try {
    console.log('POST /api/cards/process - Processing cards');
    const { selectedCards, directory } = req.body;

    console.log(`Processing ${selectedCards.length} cards from directory: ${directory}`);

    if (!selectedCards || !Array.isArray(selectedCards) || selectedCards.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Selected cards array is required'
      });
    }

    if (!directory) {
      return res.status(400).json({
        success: false,
        message: 'Directory path is required'
      });
    }

    const jobId = await CardService.processCards(selectedCards, directory);
    console.log(`Processing job created with ID: ${jobId}`);

    res.json({
      success: true,
      jobId
    });
  } catch (error) {
    console.error('Error processing cards:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get processing progress
router.get('/progress/:jobId', async (req, res) => {
  try {
    console.log(`GET /api/cards/progress/${req.params.jobId} - Getting progress`);
    const { jobId } = req.params;

    const progress = await CardService.getProcessingProgress(jobId);
    console.log(`Progress for job ${jobId}: ${progress.status} - ${progress.progress}%`);

    res.json({ progress });
  } catch (error) {
    console.error('Error getting processing progress:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get a specific card
router.get('/:id', async (req, res) => {
  try {
    console.log(`GET /api/cards/${req.params.id} - Getting card`);
    const card = await CardService.getCardById(req.params.id);
    if (!card) {
      return res.status(404).json({ message: 'Card not found' });
    }
    console.log(`Found card: ${card.name}`);
    res.json({ card });
  } catch (error) {
    console.error('Error getting card:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create a new card
router.post('/', async (req, res) => {
  try {
    console.log('POST /api/cards - Creating new card');
    const cardData = req.body;
    console.log(`Creating card: ${cardData.name}`);

    const card = await CardService.createCard(cardData);
    console.log(`Card created with ID: ${card._id}`);

    res.status(201).json({
      success: true,
      card
    });
  } catch (error) {
    console.error('Error creating card:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Update a card
router.put('/:id', async (req, res) => {
  try {
    console.log(`PUT /api/cards/${req.params.id} - Updating card`);
    const cardData = req.body;

    const card = await CardService.updateCard(req.params.id, cardData);
    if (!card) {
      return res.status(404).json({
        success: false,
        message: 'Card not found'
      });
    }

    console.log(`Card updated: ${card.name}`);
    res.json({
      success: true,
      card
    });
  } catch (error) {
    console.error('Error updating card:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Delete a card
router.delete('/:id', async (req, res) => {
  try {
    console.log(`DELETE /api/cards/${req.params.id} - Deleting card`);

    const success = await CardService.deleteCard(req.params.id);
    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'Card not found'
      });
    }

    console.log(`Card deleted: ${req.params.id}`);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting card:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Delete multiple cards
router.delete('/bulk', async (req, res) => {
  try {
    console.log('DELETE /api/cards/bulk - Deleting multiple cards');
    const { cardIds } = req.body;

    if (!cardIds || !Array.isArray(cardIds)) {
      return res.status(400).json({
        success: false,
        message: 'Card IDs array is required'
      });
    }

    console.log(`Deleting ${cardIds.length} cards`);
    const deletedCount = await CardService.deleteMultipleCards(cardIds);

    console.log(`Deleted ${deletedCount} cards`);
    res.json({
      success: true,
      deletedCount
    });
  } catch (error) {
    console.error('Error deleting cards:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Delete cards by pattern
router.delete('/wildcard', async (req, res) => {
  try {
    console.log('DELETE /api/cards/wildcard - Deleting cards by pattern');
    const { pattern } = req.body;

    if (!pattern) {
      return res.status(400).json({
        success: false,
        message: 'Pattern is required'
      });
    }

    console.log(`Deleting cards matching pattern: ${pattern}`);
    const deletedCount = await CardService.deleteCardsByPattern(pattern);

    console.log(`Deleted ${deletedCount} cards matching pattern`);
    res.json({
      success: true,
      deletedCount
    });
  } catch (error) {
    console.error('Error deleting cards by pattern:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get card pricing
router.get('/:cardId/pricing', async (req, res) => {
  try {
    console.log(`GET /api/cards/${req.params.cardId}/pricing - Getting pricing`);

    const pricing = await PriceService.getCardPricing(req.params.cardId);
    console.log(`Pricing data retrieved for card ${req.params.cardId}`);

    res.json({ pricing });
  } catch (error) {
    console.error('Error getting card pricing:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Refresh card pricing
router.post('/:cardId/pricing/refresh', async (req, res) => {
  try {
    console.log(`POST /api/cards/${req.params.cardId}/pricing/refresh - Refreshing pricing`);

    const pricing = await PriceService.refreshCardPricing(req.params.cardId);
    console.log(`Pricing data refreshed for card ${req.params.cardId}`);

    res.json({
      success: true,
      pricing
    });
  } catch (error) {
    console.error('Error refreshing card pricing:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Generate SVG placeholder image
function generatePlaceholderSVG(text, width = 200, height = 280) {
  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#f0f0f0" stroke="#ddd" stroke-width="2"/>
    <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="14" fill="#666" text-anchor="middle" dy=".3em">
      ${text}
    </text>
  </svg>`;
}

// Check if file is a text file (not a real image)
function isTextFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    // If we can read it as text and it's short, it's probably our test text files
    return content.length < 100 && !content.includes('\0');
  } catch (error) {
    return false;
  }
}

// Serve card images
router.get('/image/:imagePath', (req, res) => {
  try {
    const imagePath = decodeURIComponent(req.params.imagePath);
    console.log(`GET /api/cards/image/${imagePath} - Serving image`);

    // Security check - ensure path doesn't contain directory traversal
    if (imagePath.includes('..') || imagePath.includes('/') || imagePath.includes('\\')) {
      return res.status(400).json({ message: 'Invalid image path' });
    }

    // Try multiple possible locations for the image
    const possiblePaths = [
      path.join(process.cwd(), 'card_images', imagePath),
      path.join(process.cwd(), 'test_data', imagePath),
      path.join(process.cwd(), 'server', 'test_data', imagePath)
    ];

    let fullPath = null;
    for (const testPath of possiblePaths) {
      if (fs.existsSync(testPath)) {
        fullPath = testPath;
        break;
      }
    }

    if (!fullPath) {
      console.log(`Image not found in any of these locations:`);
      possiblePaths.forEach(p => console.log(`  - ${p}`));
      
      // Generate placeholder SVG
      const placeholderText = imagePath.replace(/\.(jpg|jpeg|png|gif)$/i, '').replace(/-/g, ' ');
      const svg = generatePlaceholderSVG(placeholderText);
      
      res.setHeader('Content-Type', 'image/svg+xml');
      res.send(svg);
      return;
    }

    // Check if the file is actually a text file (our test data)
    if (isTextFile(fullPath)) {
      console.log(`File is text, generating SVG placeholder: ${fullPath}`);
      
      // Read the text content to use as placeholder text
      const textContent = fs.readFileSync(fullPath, 'utf8').trim();
      const svg = generatePlaceholderSVG(textContent);
      
      res.setHeader('Content-Type', 'image/svg+xml');
      res.send(svg);
      return;
    }

    console.log(`Serving image from: ${fullPath}`);
    res.sendFile(fullPath);
  } catch (error) {
    console.error('Error serving image:', error);
    
    // Generate error placeholder
    const svg = generatePlaceholderSVG('Image Error');
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(svg);
  }
});

module.exports = router;