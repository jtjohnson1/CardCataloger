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
  directory: {
    type: String,
    required: true
  },
  includeSubdirectories: {
    type: Boolean,
    default: false
  },
  selectedCards: [{
    frontImage: String,
    backImage: String,
    lotNumber: String,
    iteration: String
  }],
  progress: {
    completed: {
      type: Number,
      default: 0
    },
    total: {
      type: Number,
      default: 0
    },
    speed: {
      type: Number,
      default: 0
    },
    estimatedTimeRemaining: {
      type: Number,
      default: 0
    },
    errors: [{
      type: String
    }]
  },
  currentCard: {
    frontImage: String,
    backImage: String,
    lotNumber: String,
    iteration: String
  },
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