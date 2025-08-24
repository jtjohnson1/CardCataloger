import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Card } from '../models/Card.js';
import { analyzeCardWithAI } from '../services/aiService.js';
import { searchEbayPricing } from '../services/ebayService.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/cards';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// GET /api/cards - Get all cards with optional filters
router.get('/', async (req, res) => {
  try {
    console.log('Fetching cards with filters:', req.query);
    
    const {
      search,
      sport,
      year,
      condition,
      minPrice,
      maxPrice,
      noPricing,
      page = 1,
      limit = 50
    } = req.query;

    // Build filter object
    const filters = {};
    
    if (search) {
      filters.$or = [
        { playerName: { $regex: search, $options: 'i' } },
        { cardName: { $regex: search, $options: 'i' } },
        { set: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (sport) {
      filters.sport = sport;
    }
    
    if (year) {
      filters.year = parseInt(year);
    }
    
    if (condition) {
      filters.condition = condition;
    }
    
    if (minPrice || maxPrice) {
      filters.estimatedValue = {};
      if (minPrice) filters.estimatedValue.$gte = parseFloat(minPrice);
      if (maxPrice) filters.estimatedValue.$lte = parseFloat(maxPrice);
    }
    
    // Filter for cards without pricing
    if (noPricing === 'true') {
      filters.$or = [
        { estimatedValue: { $exists: false } },
        { estimatedValue: null },
        { estimatedValue: 0 },
        { ebayListings: { $exists: false } },
        { ebayListings: { $size: 0 } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [cards, total] = await Promise.all([
      Card.find(filters)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Card.countDocuments(filters)
    ]);

    console.log(`Found ${cards.length} cards out of ${total} total`);

    res.json({
      cards,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching cards:', error);
    res.status(500).json({ error: 'Failed to fetch cards' });
  }
});

// GET /api/cards/:id - Get single card
router.get('/:id', async (req, res) => {
  try {
    console.log(`Fetching card with ID: ${req.params.id}`);
    
    const card = await Card.findById(req.params.id);
    
    if (!card) {
      console.log('Card not found');
      return res.status(404).json({ error: 'Card not found' });
    }
    
    console.log('Card found successfully');
    res.json(card);
  } catch (error) {
    console.error('Error fetching card:', error);
    res.status(500).json({ error: 'Failed to fetch card' });
  }
});

// POST /api/cards/process - Process uploaded card images
router.post('/process', upload.array('images', 10), async (req, res) => {
  try {
    console.log(`Processing ${req.files?.length || 0} uploaded images`);
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No images uploaded' });
    }

    const processedCards = [];
    
    for (const file of req.files) {
      try {
        console.log(`Processing image: ${file.filename}`);
        
        // Convert file to base64 for AI analysis
        const imageBuffer = fs.readFileSync(file.path);
        const base64Image = imageBuffer.toString('base64');
        const dataUrl = `data:${file.mimetype};base64,${base64Image}`;
        
        // Analyze card with AI
        console.log('Analyzing card with AI...');
        const aiAnalysis = await analyzeCardWithAI(dataUrl);
        
        if (!aiAnalysis) {
          console.log('AI analysis failed, skipping card');
          continue;
        }
        
        // Create card object
        const cardData = {
          frontImage: `/uploads/cards/${file.filename}`,
          backImage: null, // Will be updated if back image is provided
          playerName: aiAnalysis.playerName || 'Unknown Player',
          cardName: aiAnalysis.cardName || 'Unknown Card',
          sport: aiAnalysis.sport || 'Unknown',
          year: aiAnalysis.year || null,
          manufacturer: aiAnalysis.manufacturer || 'Unknown',
          set: aiAnalysis.set || 'Unknown Set',
          cardNumber: aiAnalysis.cardNumber || null,
          condition: aiAnalysis.condition || 'Unknown',
          estimatedValue: null,
          ebayListings: [],
          aiAnalysis: aiAnalysis,
          processingStatus: 'completed',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        // Save card to database
        const card = new Card(cardData);
        await card.save();
        
        console.log(`Card saved to database with ID: ${card._id}`);
        
        // Try to get eBay pricing (don't fail if this doesn't work)
        try {
          console.log('Fetching eBay pricing...');
          const searchQuery = `${cardData.playerName} ${cardData.year} ${cardData.set} ${cardData.cardNumber}`.trim();
          const ebayListings = await searchEbayPricing(searchQuery);
          
          if (ebayListings && ebayListings.length > 0) {
            card.ebayListings = ebayListings;
            // Calculate estimated value from eBay listings
            const prices = ebayListings.map(listing => listing.price).filter(price => price > 0);
            if (prices.length > 0) {
              card.estimatedValue = prices.reduce((sum, price) => sum + price, 0) / prices.length;
            }
            await card.save();
            console.log('eBay pricing updated successfully');
          } else {
            console.log('No eBay listings found');
          }
        } catch (ebayError) {
          console.error('eBay pricing failed (non-critical):', ebayError.message);
          // Continue processing - eBay failure shouldn't stop card creation
        }
        
        processedCards.push(card);
        
      } catch (cardError) {
        console.error(`Error processing card ${file.filename}:`, cardError);
        // Continue with other cards
      }
    }
    
    console.log(`Successfully processed ${processedCards.length} cards`);
    
    res.json({
      message: `Successfully processed ${processedCards.length} cards`,
      cards: processedCards
    });
    
  } catch (error) {
    console.error('Error processing cards:', error);
    res.status(500).json({ error: 'Failed to process cards' });
  }
});

// POST /api/cards/process-local - Process local image files
router.post('/process-local', async (req, res) => {
  try {
    const { imagePaths } = req.body;
    
    if (!imagePaths || !Array.isArray(imagePaths)) {
      return res.status(400).json({ error: 'Image paths array is required' });
    }
    
    console.log(`Processing ${imagePaths.length} local images`);
    
    const processedCards = [];
    
    for (const imagePath of imagePaths) {
      try {
        console.log(`Processing local image: ${imagePath}`);
        
        // Check if file exists
        if (!fs.existsSync(imagePath)) {
          console.log(`File not found: ${imagePath}, skipping`);
          continue;
        }
        
        // Read and copy file to uploads directory
        const imageBuffer = fs.readFileSync(imagePath);
        const fileExtension = path.extname(imagePath);
        const fileName = `local-${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExtension}`;
        const uploadPath = path.join('uploads/cards', fileName);
        
        // Ensure upload directory exists
        const uploadDir = path.dirname(uploadPath);
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        // Copy file to uploads directory
        fs.writeFileSync(uploadPath, imageBuffer);
        console.log(`Image copied to: ${uploadPath}`);
        
        // Convert to base64 for AI analysis
        const base64Image = imageBuffer.toString('base64');
        const mimeType = fileExtension.toLowerCase() === '.png' ? 'image/png' : 'image/jpeg';
        const dataUrl = `data:${mimeType};base64,${base64Image}`;
        
        // Analyze card with AI
        console.log('Analyzing card with AI...');
        const aiAnalysis = await analyzeCardWithAI(dataUrl);
        
        if (!aiAnalysis) {
          console.log('AI analysis failed, skipping card');
          continue;
        }
        
        // Create card object
        const cardData = {
          frontImage: `/uploads/cards/${fileName}`,
          backImage: null,
          playerName: aiAnalysis.playerName || 'Unknown Player',
          cardName: aiAnalysis.cardName || 'Unknown Card',
          sport: aiAnalysis.sport || 'Unknown',
          year: aiAnalysis.year || null,
          manufacturer: aiAnalysis.manufacturer || 'Unknown',
          set: aiAnalysis.set || 'Unknown Set',
          cardNumber: aiAnalysis.cardNumber || null,
          condition: aiAnalysis.condition || 'Unknown',
          estimatedValue: null,
          ebayListings: [],
          aiAnalysis: aiAnalysis,
          processingStatus: 'completed',
          originalPath: imagePath,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        // Save card to database
        const card = new Card(cardData);
        await card.save();
        
        console.log(`Card saved to database with ID: ${card._id}`);
        
        // Try to get eBay pricing (don't fail if this doesn't work)
        try {
          console.log('Fetching eBay pricing...');
          const searchQuery = `${cardData.playerName} ${cardData.year} ${cardData.set} ${cardData.cardNumber}`.trim();
          const ebayListings = await searchEbayPricing(searchQuery);
          
          if (ebayListings && ebayListings.length > 0) {
            card.ebayListings = ebayListings;
            // Calculate estimated value from eBay listings
            const prices = ebayListings.map(listing => listing.price).filter(price => price > 0);
            if (prices.length > 0) {
              card.estimatedValue = prices.reduce((sum, price) => sum + price, 0) / prices.length;
            }
            await card.save();
            console.log('eBay pricing updated successfully');
          } else {
            console.log('No eBay listings found');
          }
        } catch (ebayError) {
          console.error('eBay pricing failed (non-critical):', ebayError.message);
          // Continue processing - eBay failure shouldn't stop card creation
        }
        
        processedCards.push(card);
        
      } catch (cardError) {
        console.error(`Error processing local card ${imagePath}:`, cardError);
        // Continue with other cards
      }
    }
    
    console.log(`Successfully processed ${processedCards.length} local cards`);
    
    res.json({
      message: `Successfully processed ${processedCards.length} cards`,
      cards: processedCards
    });
    
  } catch (error) {
    console.error('Error processing local cards:', error);
    res.status(500).json({ error: 'Failed to process local cards' });
  }
});

// PUT /api/cards/:id - Update card
router.put('/:id', async (req, res) => {
  try {
    console.log(`Updating card with ID: ${req.params.id}`);
    
    const card = await Card.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    
    if (!card) {
      console.log('Card not found');
      return res.status(404).json({ error: 'Card not found' });
    }
    
    console.log('Card updated successfully');
    res.json(card);
  } catch (error) {
    console.error('Error updating card:', error);
    res.status(500).json({ error: 'Failed to update card' });
  }
});

// POST /api/cards/:id/reprice - Resubmit card to eBay for pricing
router.post('/:id/reprice', async (req, res) => {
  try {
    console.log(`Repricing card with ID: ${req.params.id}`);
    
    const card = await Card.findById(req.params.id);
    
    if (!card) {
      console.log('Card not found');
      return res.status(404).json({ error: 'Card not found' });
    }
    
    try {
      console.log('Fetching eBay pricing...');
      const searchQuery = `${card.playerName} ${card.year} ${card.set} ${card.cardNumber}`.trim();
      const ebayListings = await searchEbayPricing(searchQuery);
      
      if (ebayListings && ebayListings.length > 0) {
        card.ebayListings = ebayListings;
        // Calculate estimated value from eBay listings
        const prices = ebayListings.map(listing => listing.price).filter(price => price > 0);
        if (prices.length > 0) {
          card.estimatedValue = prices.reduce((sum, price) => sum + price, 0) / prices.length;
        }
        card.updatedAt = new Date();
        await card.save();
        
        console.log('Card repriced successfully');
        res.json({
          message: 'Card repriced successfully',
          card: card
        });
      } else {
        console.log('No eBay listings found');
        res.json({
          message: 'No eBay listings found for this card',
          card: card
        });
      }
    } catch (ebayError) {
      console.error('eBay pricing failed:', ebayError);
      res.status(500).json({ error: 'Failed to fetch eBay pricing: ' + ebayError.message });
    }
    
  } catch (error) {
    console.error('Error repricing card:', error);
    res.status(500).json({ error: 'Failed to reprice card' });
  }
});

// POST /api/cards/bulk-reprice - Resubmit multiple cards to eBay for pricing
router.post('/bulk-reprice', async (req, res) => {
  try {
    const { cardIds } = req.body;
    
    if (!cardIds || !Array.isArray(cardIds)) {
      return res.status(400).json({ error: 'Card IDs array is required' });
    }
    
    console.log(`Bulk repricing ${cardIds.length} cards`);
    
    const results = {
      success: 0,
      failed: 0,
      errors: []
    };
    
    for (const cardId of cardIds) {
      try {
        console.log(`Repricing card: ${cardId}`);
        
        const card = await Card.findById(cardId);
        
        if (!card) {
          console.log(`Card not found: ${cardId}`);
          results.failed++;
          results.errors.push(`Card not found: ${cardId}`);
          continue;
        }
        
        const searchQuery = `${card.playerName} ${card.year} ${card.set} ${card.cardNumber}`.trim();
        const ebayListings = await searchEbayPricing(searchQuery);
        
        if (ebayListings && ebayListings.length > 0) {
          card.ebayListings = ebayListings;
          // Calculate estimated value from eBay listings
          const prices = ebayListings.map(listing => listing.price).filter(price => price > 0);
          if (prices.length > 0) {
            card.estimatedValue = prices.reduce((sum, price) => sum + price, 0) / prices.length;
          }
          card.updatedAt = new Date();
          await card.save();
          
          console.log(`Card repriced successfully: ${cardId}`);
          results.success++;
        } else {
          console.log(`No eBay listings found for card: ${cardId}`);
          results.success++; // Still count as success even if no listings found
        }
        
      } catch (cardError) {
        console.error(`Error repricing card ${cardId}:`, cardError);
        results.failed++;
        results.errors.push(`Error repricing card ${cardId}: ${cardError.message}`);
      }
    }
    
    console.log(`Bulk repricing completed. Success: ${results.success}, Failed: ${results.failed}`);
    
    res.json({
      message: `Bulk repricing completed. ${results.success} successful, ${results.failed} failed.`,
      results: results
    });
    
  } catch (error) {
    console.error('Error in bulk repricing:', error);
    res.status(500).json({ error: 'Failed to bulk reprice cards' });
  }
});

// DELETE /api/cards/:id - Delete card
router.delete('/:id', async (req, res) => {
  try {
    console.log(`Deleting card with ID: ${req.params.id}`);
    
    const card = await Card.findById(req.params.id);
    
    if (!card) {
      console.log('Card not found');
      return res.status(404).json({ error: 'Card not found' });
    }
    
    // Delete associated image files
    try {
      if (card.frontImage && card.frontImage.startsWith('/uploads/')) {
        const frontImagePath = card.frontImage.substring(1); // Remove leading slash
        if (fs.existsSync(frontImagePath)) {
          fs.unlinkSync(frontImagePath);
          console.log(`Deleted front image: ${frontImagePath}`);
        }
      }
      
      if (card.backImage && card.backImage.startsWith('/uploads/')) {
        const backImagePath = card.backImage.substring(1); // Remove leading slash
        if (fs.existsSync(backImagePath)) {
          fs.unlinkSync(backImagePath);
          console.log(`Deleted back image: ${backImagePath}`);
        }
      }
    } catch (fileError) {
      console.error('Error deleting image files:', fileError);
      // Continue with database deletion even if file deletion fails
    }
    
    await Card.findByIdAndDelete(req.params.id);
    
    console.log('Card deleted successfully');
    res.json({ message: 'Card deleted successfully' });
  } catch (error) {
    console.error('Error deleting card:', error);
    res.status(500).json({ error: 'Failed to delete card' });
  }
});

// GET /api/cards/stats/dashboard - Get dashboard statistics
router.get('/stats/dashboard', async (req, res) => {
  try {
    console.log('Fetching dashboard statistics');
    
    const [
      totalCards,
      cardsWithPricing,
      cardsWithoutPricing,
      totalValue,
      recentCards
    ] = await Promise.all([
      Card.countDocuments(),
      Card.countDocuments({
        $and: [
          { estimatedValue: { $exists: true } },
          { estimatedValue: { $ne: null } },
          { estimatedValue: { $gt: 0 } }
        ]
      }),
      Card.countDocuments({
        $or: [
          { estimatedValue: { $exists: false } },
          { estimatedValue: null },
          { estimatedValue: 0 }
        ]
      }),
      Card.aggregate([
        {
          $match: {
            estimatedValue: { $exists: true, $ne: null, $gt: 0 }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$estimatedValue' }
          }
        }
      ]),
      Card.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('playerName cardName estimatedValue frontImage createdAt')
    ]);
    
    const stats = {
      totalCards,
      cardsWithPricing,
      cardsWithoutPricing,
      totalValue: totalValue.length > 0 ? totalValue[0].total : 0,
      recentCards
    };
    
    console.log('Dashboard statistics fetched successfully');
    res.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard statistics:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

export default router;