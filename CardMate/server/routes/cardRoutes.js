const express = require('express');
const router = express.Router();
const cardController = require('../controllers/cardController');

// POST /api/cards/scan/directory - Scan directory for card images
router.post('/scan/directory', cardController.scanDirectory.bind(cardController));

// GET /api/cards/browse/directories - Browse filesystem directories
router.get('/browse/directories', cardController.browseDirectories.bind(cardController));

// GET /api/cards - Get all cards with filtering and sorting
router.get('/', cardController.getAllCards.bind(cardController));

// POST /api/cards - Create new card manually
router.post('/', cardController.createCard.bind(cardController));

// POST /api/cards/process - Process card images with OCR and create card
router.post('/process',
  cardController.upload.fields([
    { name: 'frontImage', maxCount: 1 },
    { name: 'backImage', maxCount: 1 }
  ]),
  cardController.processCardImages.bind(cardController)
);

// DELETE /api/cards/clear-all - Clear all cards (MUST come before /:id route)
router.delete('/clear-all', cardController.clearAllCards.bind(cardController));

// DELETE /api/cards/bulk - Delete multiple cards
router.delete('/bulk', cardController.deleteMultipleCards.bind(cardController));

// GET /api/cards/:id - Get single card by ID (MUST come after specific routes)
router.get('/:id', cardController.getCardById.bind(cardController));

// PUT /api/cards/:id - Update card
router.put('/:id', cardController.updateCard.bind(cardController));

// DELETE /api/cards/:id - Delete single card (MUST come after specific routes)
router.delete('/:id', cardController.deleteCard.bind(cardController));

module.exports = router;