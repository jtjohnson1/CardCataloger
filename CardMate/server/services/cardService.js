const Card = require('../models/Card');
const ocrService = require('./ocrService');
const fs = require('fs');
const path = require('path');

class CardService {
  async createCard(cardData) {
    try {
      console.log('=== CARD SERVICE CREATE START ===');
      console.log('Creating new card:', cardData.playerName);
      console.log('Card data being saved to database:', {
        ...cardData,
        frontImage: cardData.frontImage ? `[BASE64 DATA ${cardData.frontImage.length} chars]` : 'NO IMAGE',
        backImage: cardData.backImage ? `[BASE64 DATA ${cardData.backImage.length} chars]` : 'NO IMAGE'
      });

      console.log('=== CREATING MONGOOSE MODEL ===');
      const card = new Card(cardData);
      console.log('Mongoose model created, about to save...');

      console.log('=== SAVING TO DATABASE ===');
      const savedCard = await card.save();
      console.log('=== DATABASE SAVE COMPLETE ===');

      console.log('Card created successfully with ID:', savedCard._id);
      console.log('Saved card data keys:', Object.keys(savedCard.toObject()));
      console.log('=== CARD SERVICE CREATE END - SUCCESS ===');
      return savedCard;
    } catch (error) {
      console.error('=== CARD SERVICE CREATE ERROR ===');
      console.error('Error creating card:', error.message);
      console.error('Full error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        errors: error.errors // Mongoose validation errors
      });
      console.log('=== CARD SERVICE CREATE END - ERROR ===');
      throw new Error(`Failed to create card: ${error.message}`);
    }
  }

  async processCardImages(frontImagePath, backImagePath) {
    try {
      console.log('Processing card images with OCR...');

      // Process both images
      const [frontResult, backResult] = await Promise.all([
        ocrService.processCardImage(frontImagePath, 'front'),
        ocrService.processCardImage(backImagePath, 'back')
      ]);

      if (!frontResult.success) {
        throw new Error(`Front image processing failed: ${frontResult.error}`);
      }

      // Merge data from both images, prioritizing front image data
      const mergedData = {
        ...frontResult.data,
        ...backResult.data,
        // Front image data takes precedence for main fields
        playerName: frontResult.data.playerName || backResult.data.playerName || 'Unknown Player',
        year: frontResult.data.year || backResult.data.year || new Date().getFullYear(),
        manufacturer: frontResult.data.manufacturer || backResult.data.manufacturer || 'Unknown',
        setName: frontResult.data.setName || 'Unknown Set',
        cardNumber: frontResult.data.cardNumber || backResult.data.cardNumber || '0',
        team: frontResult.data.team || '',
        sport: frontResult.data.sport || 'Non-Sports'
      };

      return {
        success: true,
        data: mergedData,
        processingTime: frontResult.processingTime,
        confidence: frontResult.confidence,
        modelUsed: ocrService.defaultModel
      };

    } catch (error) {
      console.error('Error processing card images:', error.message);
      console.error('Full error:', error);
      throw new Error(`Card image processing failed: ${error.message}`);
    }
  }

  async getAllCards(filters = {}, sortBy = 'dateAdded', sortOrder = 'desc', limit = 100, skip = 0) {
    try {
      console.log('Fetching cards with filters:', filters);

      let query = {};

      // Apply filters
      if (filters.sport && filters.sport !== '') {
        query.sport = filters.sport;
      }

      if (filters.manufacturer && Array.isArray(filters.manufacturer) && filters.manufacturer.length > 0) {
        query.manufacturer = { $in: filters.manufacturer };
      }

      if (filters.yearRange && Array.isArray(filters.yearRange) && filters.yearRange.length === 2) {
        query.year = { $gte: filters.yearRange[0], $lte: filters.yearRange[1] };
      }

      if (filters.valueRange && Array.isArray(filters.valueRange) && filters.valueRange.length === 2) {
        query.estimatedValue = { $gte: filters.valueRange[0], $lte: filters.valueRange[1] };
      }

      if (filters.team && filters.team !== '') {
        query.team = { $regex: filters.team, $options: 'i' };
      }

      if (filters.search && filters.search !== '') {
        query.$or = [
          { playerName: { $regex: filters.search, $options: 'i' } },
          { setName: { $regex: filters.search, $options: 'i' } },
          { manufacturer: { $regex: filters.search, $options: 'i' } }
        ];
      }

      // Build sort object
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      const cards = await Card.find(query)
        .sort(sort)
        .limit(limit)
        .skip(skip)
        .lean();

      const totalCount = await Card.countDocuments(query);

      console.log(`Found ${cards.length} cards out of ${totalCount} total`);
      console.log('Cards retrieved from database:', JSON.stringify(cards, null, 2));

      return {
        cards,
        totalCount,
        hasMore: skip + cards.length < totalCount
      };

    } catch (error) {
      console.error('Error fetching cards:', error.message);
      console.error('Full error:', error);
      throw new Error(`Failed to fetch cards: ${error.message}`);
    }
  }

  async getCardById(cardId) {
    try {
      console.log('Fetching card by ID:', cardId);

      const card = await Card.findById(cardId);
      if (!card) {
        throw new Error('Card not found');
      }

      console.log('Card retrieved by ID:', JSON.stringify(card, null, 2));
      return card;
    } catch (error) {
      console.error('Error fetching card by ID:', error.message);
      console.error('Full error:', error);
      throw new Error(`Failed to fetch card: ${error.message}`);
    }
  }

  async deleteCard(cardId) {
    try {
      console.log('Deleting card:', cardId);

      const deletedCard = await Card.findByIdAndDelete(cardId);
      if (!deletedCard) {
        throw new Error('Card not found');
      }

      console.log('Card deleted successfully');
      return deletedCard;
    } catch (error) {
      console.error('Error deleting card:', error.message);
      console.error('Full error:', error);
      throw new Error(`Failed to delete card: ${error.message}`);
    }
  }

  async deleteMultipleCards(cardIds) {
    try {
      console.log(`Deleting ${cardIds.length} cards`);

      const result = await Card.deleteMany({ _id: { $in: cardIds } });

      console.log(`Successfully deleted ${result.deletedCount} cards`);
      return {
        deletedCount: result.deletedCount,
        success: true
      };
    } catch (error) {
      console.error('Error deleting multiple cards:', error.message);
      console.error('Full error:', error);
      throw new Error(`Failed to delete cards: ${error.message}`);
    }
  }

  async clearAllCards() {
    try {
      console.log('Clearing all cards from database...');

      const result = await Card.deleteMany({});

      console.log(`Successfully cleared ${result.deletedCount} cards from database`);
      return {
        deletedCount: result.deletedCount,
        success: true
      };
    } catch (error) {
      console.error('Error clearing all cards:', error.message);
      console.error('Full error:', error);
      throw new Error(`Failed to clear all cards: ${error.message}`);
    }
  }

  async updateCard(cardId, updateData) {
    try {
      console.log('Updating card:', cardId);
      console.log('Update data:', JSON.stringify(updateData, null, 2));

      const updatedCard = await Card.findByIdAndUpdate(
        cardId,
        { ...updateData, updatedAt: new Date() },
        { new: true, runValidators: true }
      );

      if (!updatedCard) {
        throw new Error('Card not found');
      }

      console.log('Card updated successfully');
      console.log('Updated card data:', JSON.stringify(updatedCard, null, 2));
      return updatedCard;
    } catch (error) {
      console.error('Error updating card:', error.message);
      console.error('Full error:', error);
      throw new Error(`Failed to update card: ${error.message}`);
    }
  }

  async getCardStats() {
    try {
      console.log('Fetching card statistics...');

      const totalCards = await Card.countDocuments();
      const totalValue = await Card.aggregate([
        { $group: { _id: null, total: { $sum: '$estimatedValue' } } }
      ]);

      const highValueCards = await Card.countDocuments({ estimatedValue: { $gt: 100 } });

      const recentCards = await Card.countDocuments({
        dateAdded: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      });

      const stats = {
        totalCards,
        totalValue: totalValue.length > 0 ? totalValue[0].total : 0,
        highValueCards,
        recentCards
      };

      console.log('Card statistics:', JSON.stringify(stats, null, 2));
      return stats;
    } catch (error) {
      console.error('Error getting card stats:', error.message);
      console.error('Full error:', error);
      throw new Error(`Failed to get card statistics: ${error.message}`);
    }
  }
}

module.exports = new CardService();