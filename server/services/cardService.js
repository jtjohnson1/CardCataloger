const Card = require('../models/Card');
const fileService = require('./fileService');
const processingService = require('./processingService');

class CardService {
  async createCard(cardData) {
    try {
      console.log('CardService.createCard called with data:', JSON.stringify(cardData, null, 2));

      // Validate required fields
      if (!cardData.name || !cardData.lotNumber || !cardData.iteration) {
        const error = 'Name, lot number, and iteration are required fields';
        console.error('Validation error:', error);
        throw new Error(error);
      }

      console.log('Creating new Card document...');
      // Set default values for optional fields
      const card = new Card({
        frontImage: cardData.frontImage || '',
        backImage: cardData.backImage || null,
        name: cardData.name,
        manufacturer: cardData.manufacturer || 'Unknown',
        year: cardData.year || 'Unknown',
        player: cardData.player || 'Unknown',
        series: cardData.series || 'Unknown',
        cardNumber: cardData.cardNumber || 'Unknown',
        estimatedValue: cardData.estimatedValue || 0,
        sport: cardData.sport || 'Unknown',
        set: cardData.set || 'Unknown',
        condition: cardData.condition || 'Unknown',
        lotNumber: cardData.lotNumber,
        iteration: cardData.iteration
      });

      console.log('Saving card to database...');
      const savedCard = await card.save();
      console.log(`Card saved successfully with ID: ${savedCard._id}`);
      console.log('Saved card data:', JSON.stringify(savedCard, null, 2));
      return savedCard;
    } catch (error) {
      console.error('Error in CardService.createCard:', error);
      console.error('Error stack:', error.stack);
      throw error;
    }
  }

  async scanDirectory(directory, includeSubdirectories) {
    try {
      console.log(`Card service scanning directory: ${directory}`);
      return await fileService.scanDirectory(directory, includeSubdirectories);
    } catch (error) {
      console.error('Error in card service scan directory:', error);
      throw error;
    }
  }

  async processCards(directory, includeSubdirectories, selectedCardIndices, scannedCards) {
    try {
      // Convert indices to actual card data
      const selectedCards = selectedCardIndices.map(index => {
        const cardIndex = parseInt(index);
        if (cardIndex >= 0 && cardIndex < scannedCards.length) {
          return scannedCards[cardIndex];
        }
        return null;
      }).filter(card => card !== null);

      if (selectedCards.length === 0) {
        throw new Error('No valid cards selected for processing');
      }

      console.log(`Processing ${selectedCards.length} selected cards`);
      return await processingService.createProcessingJob(directory, includeSubdirectories, selectedCards);
    } catch (error) {
      console.error('Error in card service process cards:', error);
      throw error;
    }
  }

  async getProcessingProgress(jobId) {
    try {
      return await processingService.getJobProgress(jobId);
    } catch (error) {
      console.error('Error getting processing progress:', error);
      throw error;
    }
  }

  async getAllCards() {
    try {
      console.log('CardService.getAllCards called');
      const cards = await Card.find().sort({ createdAt: -1 });
      console.log(`CardService.getAllCards - Found ${cards.length} cards in database`);
      if (cards.length > 0) {
        console.log('Sample card data:', JSON.stringify(cards[0], null, 2));
      }
      return cards;
    } catch (error) {
      console.error('Error in CardService.getAllCards:', error);
      console.error('Error stack:', error.stack);
      throw error;
    }
  }

  async getCardById(cardId) {
    try {
      console.log(`CardService.getCardById called with ID: ${cardId}`);
      const card = await Card.findById(cardId);
      if (!card) {
        console.log(`Card with ID ${cardId} not found`);
        throw new Error('Card not found');
      }
      console.log(`CardService.getCardById - Found card: ${card.name}`);
      return card;
    } catch (error) {
      console.error('Error in CardService.getCardById:', error);
      console.error('Error stack:', error.stack);
      throw error;
    }
  }

  async deleteCards(cardIds) {
    try {
      console.log(`Card service: Deleting ${cardIds.length} cards`);
      const result = await Card.deleteMany({ _id: { $in: cardIds } });
      console.log(`Deleted ${result.deletedCount} cards`);
      return {
        success: true,
        message: `${result.deletedCount} cards deleted successfully`,
        deletedCount: result.deletedCount
      };
    } catch (error) {
      console.error('Error deleting cards:', error);
      throw error;
    }
  }
}

module.exports = new CardService();