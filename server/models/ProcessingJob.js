const mongoose = require('mongoose');

const processingJobSchema = new mongoose.Schema({
  jobId: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  totalCards: {
    type: Number,
    required: true
  },
  cardsCompleted: {
    type: Number,
    default: 0
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  selectedCards: [{
    type: String,  // Array of strings, not embedded documents
    required: true
  }],
  directory: {
    type: String,
    required: true
  },
  currentCard: {
    type: String
  },
  errors: [{
    type: String
  }],
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ProcessingJob', processingJobSchema);