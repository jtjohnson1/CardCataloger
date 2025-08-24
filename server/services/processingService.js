const ProcessingJob = require('../models/ProcessingJob');
const Card = require('../models/Card');
const { v4: uuidv4 } = require('uuid');

class ProcessingService {
  constructor() {
    this.activeJobs = new Map();
  }

  async createProcessingJob(directory, includeSubdirectories, selectedCards) {
    try {
      const jobId = uuidv4();
      console.log(`Creating processing job ${jobId} for ${selectedCards.length} cards`);

      const job = new ProcessingJob({
        jobId,
        directory,
        includeSubdirectories,
        selectedCards,
        progress: {
          completed: 0,
          total: selectedCards.length,
          speed: 0,
          estimatedTimeRemaining: 0,
          errors: []
        }
      });

      await job.save();
      
      // Start processing asynchronously
      this.startProcessing(jobId);

      return { jobId, message: 'Processing started', cardCount: selectedCards.length };
    } catch (error) {
      console.error('Error creating processing job:', error);
      throw error;
    }
  }

  async startProcessing(jobId) {
    try {
      console.log(`Starting processing for job ${jobId}`);
      const job = await ProcessingJob.findOne({ jobId });
      
      if (!job) {
        throw new Error('Job not found');
      }

      job.status = 'processing';
      await job.save();

      const startTime = Date.now();
      
      for (let i = 0; i < job.selectedCards.length; i++) {
        const cardData = job.selectedCards[i];
        
        // Update current card being processed
        job.currentCard = cardData;
        job.progress.completed = i;
        
        // Calculate speed and estimated time
        const elapsed = (Date.now() - startTime) / 1000 / 60; // minutes
        job.progress.speed = elapsed > 0 ? (i + 1) / elapsed : 0;
        const remaining = job.selectedCards.length - (i + 1);
        job.progress.estimatedTimeRemaining = job.progress.speed > 0 ? remaining / job.progress.speed : 0;
        
        await job.save();

        try {
          // Simulate AI processing time
          await this.simulateAIProcessing();
          
          // Create card record
          await this.processCard(cardData);
          
        } catch (error) {
          console.error(`Error processing card ${cardData.lotNumber}-${cardData.iteration}:`, error);
          job.progress.errors.push(`Failed to process ${cardData.lotNumber}-${cardData.iteration}: ${error.message}`);
        }
      }

      // Mark job as completed
      job.status = 'completed';
      job.progress.completed = job.selectedCards.length;
      job.currentCard = null;
      job.endTime = new Date();
      await job.save();

      console.log(`Processing job ${jobId} completed`);
      
    } catch (error) {
      console.error(`Error in processing job ${jobId}:`, error);
      
      // Mark job as failed
      const job = await ProcessingJob.findOne({ jobId });
      if (job) {
        job.status = 'failed';
        job.progress.errors.push(`Job failed: ${error.message}`);
        await job.save();
      }
    }
  }

  async simulateAIProcessing() {
    // Simulate AI processing time (1-3 seconds)
    const delay = Math.random() * 2000 + 1000;
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  async processCard(cardData) {
    // Simulate AI extraction results
    const mockResults = {
      name: `Card ${cardData.lotNumber}-${cardData.iteration}`,
      manufacturer: ['Topps', 'Upper Deck', 'Panini', 'Fleer'][Math.floor(Math.random() * 4)],
      year: String(1980 + Math.floor(Math.random() * 44)),
      player: ['Michael Jordan', 'Ken Griffey Jr.', 'Derek Jeter', 'Wayne Gretzky'][Math.floor(Math.random() * 4)],
      series: 'Base Set',
      cardNumber: String(Math.floor(Math.random() * 500) + 1),
      estimatedValue: Math.floor(Math.random() * 1000) + 10,
      sport: ['Baseball', 'Basketball', 'Football', 'Hockey'][Math.floor(Math.random() * 4)],
      set: 'Regular',
      condition: ['Mint', 'Near Mint', 'Excellent', 'Very Good'][Math.floor(Math.random() * 4)]
    };

    const card = new Card({
      ...mockResults,
      frontImage: cardData.frontImage,
      backImage: cardData.backImage,
      lotNumber: cardData.lotNumber,
      iteration: cardData.iteration
    });

    await card.save();
    return card;
  }

  async getJobProgress(jobId) {
    try {
      const job = await ProcessingJob.findOne({ jobId });
      
      if (!job) {
        throw new Error('Job not found');
      }

      return {
        currentCard: job.currentCard,
        completed: job.progress.completed,
        total: job.progress.total,
        speed: Math.round(job.progress.speed * 10) / 10,
        estimatedTimeRemaining: Math.round(job.progress.estimatedTimeRemaining),
        errors: job.progress.errors,
        status: job.status
      };
    } catch (error) {
      console.error('Error getting job progress:', error);
      throw error;
    }
  }
}

module.exports = new ProcessingService();