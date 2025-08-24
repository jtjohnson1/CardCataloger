const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  manufacturer: {
    type: String,
    default: 'Unknown',
    trim: true
  },
  year: {
    type: Number,
    min: 1800,
    max: new Date().getFullYear() + 10
  },
  player: {
    type: String,
    default: 'Unknown Player',
    trim: true
  },
  team: {
    type: String,
    default: 'Unknown Team',
    trim: true
  },
  cardNumber: {
    type: String,
    trim: true
  },
  series: {
    type: String,
    default: 'Unknown Series',
    trim: true
  },
  condition: {
    type: String,
    enum: ['Mint', 'Near Mint', 'Excellent', 'Very Good', 'Good', 'Fair', 'Poor', 'Unknown'],
    default: 'Unknown'
  },
  estimatedValue: {
    type: Number,
    default: 0,
    min: 0
  },
  images: {
    front: {
      type: String,
      required: true
    },
    back: {
      type: String
    }
  },
  fileInfo: {
    frontFile: {
      type: String,
      required: true
    },
    backFile: {
      type: String
    },
    lotNumber: {
      type: String,
      required: true
    },
    iteration: {
      type: String,
      required: true
    }
  },
  dateAdded: {
    type: Date,
    default: Date.now
  },
  dateModified: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Update dateModified on save
cardSchema.pre('save', function(next) {
  this.dateModified = new Date();
  next();
});

module.exports = mongoose.model('Card', cardSchema);