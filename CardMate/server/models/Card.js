const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema({
  playerName: {
    type: String,
    required: true,
    trim: true
  },
  year: {
    type: Number,
    required: true,
    min: 1800,
    max: new Date().getFullYear() + 1
  },
  manufacturer: {
    type: String,
    required: true,
    trim: true
  },
  setName: {
    type: String,
    required: true,
    trim: true
  },
  cardNumber: {
    type: String,
    default: '0',
    trim: true
  },
  team: {
    type: String,
    default: '',
    trim: true
  },
  sport: {
    type: String,
    required: true,
    enum: ['Baseball', 'Basketball', 'Football', 'Hockey', 'Soccer', 'Non-Sports'],
    default: 'Non-Sports'
  },
  estimatedValue: {
    type: Number,
    default: 0,
    min: 0
  },
  frontImage: {
    type: String,
    required: true
  },
  backImage: {
    type: String,
    required: false
  },
  notes: {
    type: String,
    default: '',
    trim: true
  },
  aiConfidence: {
    type: Number,
    default: 0,
    min: 0,
    max: 1
  },
  modelUsed: {
    type: String,
    default: 'manual',
    trim: true
  },
  processingTime: {
    type: String,
    default: '0s',
    trim: true
  },
  needsPricing: {
    type: Boolean,
    default: true
  },
  isPaired: {
    type: Boolean,
    default: false
  },
  originalFrontPath: {
    type: String,
    default: '',
    trim: true
  },
  originalBackPath: {
    type: String,
    default: '',
    trim: true
  },
  dateAdded: {
    type: Date,
    default: Date.now
  },
  lastPriceUpdate: {
    type: Date,
    default: null
  },
  analysisDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient querying
cardSchema.index({ playerName: 1, year: 1, setName: 1 });
cardSchema.index({ needsPricing: 1 });
cardSchema.index({ isPaired: 1 });
cardSchema.index({ dateAdded: -1 });

// Virtual to check if card has both images
cardSchema.virtual('hasCompleteImageSet').get(function() {
  return !!(this.frontImage && this.backImage && this.frontImage !== this.backImage);
});

// Method to get image count
cardSchema.methods.getImageCount = function() {
  let count = 0;
  if (this.frontImage) count++;
  if (this.backImage && this.backImage !== this.frontImage) count++;
  return count;
};

module.exports = mongoose.model('Card', cardSchema);