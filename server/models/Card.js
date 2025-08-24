const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema({
  frontImage: {
    type: String,
    required: true
  },
  backImage: {
    type: String,
    default: null
  },
  name: {
    type: String,
    required: true
  },
  manufacturer: {
    type: String,
    default: 'Unknown'
  },
  year: {
    type: String,
    default: 'Unknown'
  },
  player: {
    type: String,
    default: 'Unknown'
  },
  series: {
    type: String,
    default: 'Unknown'
  },
  cardNumber: {
    type: String,
    default: 'Unknown'
  },
  estimatedValue: {
    type: Number,
    default: 0
  },
  sport: {
    type: String,
    default: 'Unknown'
  },
  set: {
    type: String,
    default: 'Unknown'
  },
  condition: {
    type: String,
    default: 'Unknown'
  },
  lotNumber: {
    type: String,
    required: true
  },
  iteration: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Card', cardSchema);