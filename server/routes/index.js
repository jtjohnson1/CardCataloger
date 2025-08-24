const express = require('express');
const router = express.Router();
const cardRoutes = require('./cardRoutes');
const systemRoutes = require('./systemRoutes');

// Home route
router.get('/', (req, res) => {
  res.json({ message: 'CardCataloger API Server' });
});

// API routes
router.use('/api/cards', cardRoutes);
router.use('/api/system', systemRoutes);

module.exports = router;