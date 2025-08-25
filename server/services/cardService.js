const Card = require('../models/Card');
const ProcessingJob = require('../models/ProcessingJob');
const FileService = require('./fileService');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

class CardService {
  constructor() {
    console.log('CardService initialized');
  }

  async getAllCards() {
    try {
      console.log('CardService.getAllCards called');
      const cards = await Card.find().sort({ dateAdded: -1 });
      console.log(`CardService.getAllCards - Found ${cards.length} cards in database`);
      return cards;
    } catch (error) {
      console.error('Error in CardService.getAllCards:', error);
      throw error;
    }
  }

  async getCardById(cardId) {
    try {
      console.log(`CardService.getCardById called for ID: ${cardId}`);
      const card = await Card.findById(cardId);
      if (!card) {
        console.log(`CardService.getCardById - Card not found: ${cardId}`);
        return null;
      }
      console.log(`CardService.getCardById - Found card: ${card.name}`);
      return card;
    } catch (error) {
      console.error('Error in CardService.getCardById:', error);
      throw error;
    }
  }

  async createCard(cardData) {
    try {
      console.log('CardService.createCard called');
      console.log('Card data:', JSON.stringify(cardData, null, 2));

      const card = new Card({
        ...cardData,
        dateAdded: new Date()
      });

      const savedCard = await card.save();
      console.log(`CardService.createCard - Card created with ID: ${savedCard._id}`);
      return savedCard;
    } catch (error) {
      console.error('Error in CardService.createCard:', error);
      throw error;
    }
  }

  async updateCard(cardId, cardData) {
    try {
      console.log(`CardService.updateCard called for ID: ${cardId}`);
      const updatedCard = await Card.findByIdAndUpdate(
        cardId,
        { ...cardData, dateModified: new Date() },
        { new: true, runValidators: true }
      );

      if (!updatedCard) {
        console.log(`CardService.updateCard - Card not found: ${cardId}`);
        return null;
      }

      console.log(`CardService.updateCard - Card updated: ${updatedCard.name}`);
      return updatedCard;
    } catch (error) {
      console.error('Error in CardService.updateCard:', error);
      throw error;
    }
  }

  async deleteCard(cardId) {
    try {
      console.log(`CardService.deleteCard called for ID: ${cardId}`);
      const deletedCard = await Card.findByIdAndDelete(cardId);

      if (!deletedCard) {
        console.log(`CardService.deleteCard - Card not found: ${cardId}`);
        return false;
      }

      console.log(`CardService.deleteCard - Card deleted: ${deletedCard.name}`);
      return true;
    } catch (error) {
      console.error('Error in CardService.deleteCard:', error);
      throw error;
    }
  }

  async deleteMultipleCards(cardIds) {
    try {
      console.log(`CardService.deleteMultipleCards called for ${cardIds.length} cards`);
      const result = await Card.deleteMany({ _id: { $in: cardIds } });
      console.log(`CardService.deleteMultipleCards - Deleted ${result.deletedCount} cards`);
      return result.deletedCount;
    } catch (error) {
      console.error('Error in CardService.deleteMultipleCards:', error);
      throw error;
    }
  }

  async deleteCardsByPattern(pattern) {
    try {
      console.log(`CardService.deleteCardsByPattern called with pattern: ${pattern}`);

      // Convert wildcard pattern to regex
      const regexPattern = pattern
        .replace(/\*/g, '.*')
        .replace(/\?/g, '.');

      const regex = new RegExp(regexPattern, 'i');

      // Search in multiple fields
      const query = {
        $or: [
          { name: regex },
          { manufacturer: regex },
          { 'fileInfo.lotNumber': regex },
          { player: regex },
          { team: regex }
        ]
      };

      const result = await Card.deleteMany(query);
      console.log(`CardService.deleteCardsByPattern - Deleted ${result.deletedCount} cards matching pattern`);
      return result.deletedCount;
    } catch (error) {
      console.error('Error in CardService.deleteCardsByPattern:', error);
      throw error;
    }
  }

  async scanDirectory(directory, includeSubdirectories = false) {
    try {
      console.log(`CardService.scanDirectory called - Directory: ${directory}, Include subdirs: ${includeSubdirectories}`);

      // Check if the directory exists
      if (!fs.existsSync(directory)) {
        throw new Error(`Directory does not exist: ${directory}`);
      }

      // Check if it's actually a directory
      const stats = fs.statSync(directory);
      if (!stats.isDirectory()) {
        throw new Error(`Path is not a directory: ${directory}`);
      }

      // Use FileService to scan for card files
      const scanResult = await FileService.scanDirectory(directory, includeSubdirectories);
      console.log(`CardService.scanDirectory - Scan completed: ${scanResult.validPairs.length} pairs, ${scanResult.singleCards.length} singles`);

      return scanResult;
    } catch (error) {
      console.error('Error in CardService.scanDirectory:', error);
      throw error;
    }
  }

  async processCards(selectedCards, directory) {
    try {
      console.log(`CardService.processCards called - Processing ${selectedCards.length} cards from ${directory}`);

      // Create a processing job
      const jobId = uuidv4();
      const job = new ProcessingJob({
        jobId,
        status: 'pending',
        totalCards: selectedCards.length,
        cardsCompleted: 0,
        progress: 0,
        selectedCards,
        directory,
        startTime: new Date()
      });

      await job.save();
      console.log(`CardService.processCards - Created job: ${jobId}`);

      // Start processing in background
      this.processCardsInBackground(jobId, selectedCards, directory);

      return jobId;
    } catch (error) {
      console.error('Error in CardService.processCards:', error);
      throw error;
    }
  }

  async processCardsInBackground(jobId, selectedCards, directory) {
    try {
      console.log(`CardService.processCardsInBackground - Starting real AI processing for job: ${jobId}`);

      const job = await ProcessingJob.findOne({ jobId });
      if (!job) {
        console.error(`Job not found: ${jobId}`);
        return;
      }

      // Update job status to processing
      job.status = 'processing';
      await job.save();

      // Process each card with real AI
      for (let i = 0; i < selectedCards.length; i++) {
        const cardId = selectedCards[i];
        console.log(`Processing card ${i + 1}/${selectedCards.length}: ${cardId}`);

        try {
          // 1. Load actual images from directory
          const frontImagePath = path.join(directory, `${cardId}-front.jpg`);
          const backImagePath = path.join(directory, `${cardId}-back.jpg`);

          if (!fs.existsSync(frontImagePath)) {
            throw new Error(`Front image not found: ${frontImagePath}`);
          }

          // 2. Send to Ollama for AI analysis
          const aiAnalysis = await this.analyzeCardWithAI(frontImagePath, backImagePath);

          // 3. Create card with AI-extracted details
          const cardData = {
            name: aiAnalysis.name || `Card ${cardId}`,
            manufacturer: aiAnalysis.manufacturer || 'Unknown',
            year: aiAnalysis.year || new Date().getFullYear(),
            player: aiAnalysis.player || 'Unknown Player',
            team: aiAnalysis.team || 'Unknown Team',
            cardNumber: aiAnalysis.cardNumber || cardId,
            series: aiAnalysis.series || 'Unknown Series',
            condition: aiAnalysis.condition || 'Unknown',
            estimatedValue: aiAnalysis.estimatedValue || 0,
            images: {
              front: `${cardId}-front.jpg`,
              back: fs.existsSync(backImagePath) ? `${cardId}-back.jpg` : undefined
            },
            fileInfo: {
              frontFile: `${cardId}-front.jpg`,
              backFile: fs.existsSync(backImagePath) ? `${cardId}-back.jpg` : undefined,
              lotNumber: cardId.split('-')[0] || 'unknown',
              iteration: cardId.split('-')[1] || '001'
            }
          };

          await this.createCard(cardData);

          // Update progress
          job.cardsCompleted = i + 1;
          job.progress = Math.round((job.cardsCompleted / job.totalCards) * 100);
          job.currentCard = cardId;
          await job.save();

        } catch (cardError) {
          console.error(`Error processing card ${cardId}:`, cardError);
          job.errors.push(`Error processing ${cardId}: ${cardError.message}`);
          await job.save();
        }
      }

      // Mark job as completed
      job.status = 'completed';
      job.endTime = new Date();
      await job.save();

      console.log(`CardService.processCardsInBackground - Job completed: ${jobId}`);

    } catch (error) {
      console.error('Error in CardService.processCardsInBackground:', error);
      // Mark job as failed
      try {
        const job = await ProcessingJob.findOne({ jobId });
        if (job) {
          job.status = 'failed';
          job.errors.push(`Processing failed: ${error.message}`);
          job.endTime = new Date();
          await job.save();
        }
      } catch (updateError) {
        console.error('Error updating failed job status:', updateError);
      }
    }
  }

  async analyzeCardWithAI(frontImagePath, backImagePath) {
    const OllamaService = require('./ollamaService');

    try {
      console.log(`CardService.analyzeCardWithAI - Analyzing card images: ${frontImagePath}`);
      
      // Read image files
      const frontImageBuffer = fs.readFileSync(frontImagePath);
      const backImageBuffer = backImagePath && fs.existsSync(backImagePath)
        ? fs.readFileSync(backImagePath)
        : null;

      // Send to Ollama for analysis
      const analysis = await OllamaService.analyzeCard(frontImageBuffer, backImageBuffer);

      console.log(`CardService.analyzeCardWithAI - Analysis completed for card`);
      return analysis;
    } catch (error) {
      console.error('Error analyzing card with AI:', error);
      throw error;
    }
  }

  async getProcessingProgress(jobId) {
    try {
      console.log(`CardService.getProcessingProgress called for job: ${jobId}`);

      const job = await ProcessingJob.findOne({ jobId });
      if (!job) {
        throw new Error(`Processing job not found: ${jobId}`);
      }

      const progress = {
        jobId: job.jobId,
        status: job.status,
        progress: job.progress,
        currentCard: job.currentCard,
        cardsCompleted: job.cardsCompleted,
        totalCards: job.totalCards,
        errors: job.errors || []
      };

      // Calculate estimated time remaining
      if (job.status === 'processing' && job.cardsCompleted > 0) {
        const elapsedTime = Date.now() - job.startTime.getTime();
        const avgTimePerCard = elapsedTime / job.cardsCompleted;
        const remainingCards = job.totalCards - job.cardsCompleted;
        progress.estimatedTimeRemaining = Math.round((avgTimePerCard * remainingCards) / 1000); // in seconds
      }

      console.log(`CardService.getProcessingProgress - Job ${jobId}: ${progress.status} - ${progress.progress}%`);
      return progress;

    } catch (error) {
      console.error('Error in CardService.getProcessingProgress:', error);
      throw error;
    }
  }
}

module.exports = new CardService();