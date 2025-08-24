import mongoose, { Document, Schema } from 'mongoose';

export interface ICard extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  set: string;
  rarity: string;
  condition: string;
  frontImage: string;
  backImage: string;
  frontImageData?: string; // Base64 encoded image data
  backImageData?: string;  // Base64 encoded image data
  originalFrontPath?: string; // Original local file path
  originalBackPath?: string;  // Original local file path
  estimatedValue?: number;
  ebayPrice?: number;
  tcgPlayerPrice?: number;
  lastPriceUpdate?: Date;
  needsPricing: boolean;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  ocrData?: {
    frontText?: string;
    backText?: string;
    confidence?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const CardSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  set: {
    type: String,
    required: true,
    trim: true
  },
  rarity: {
    type: String,
    required: true,
    trim: true
  },
  condition: {
    type: String,
    required: true,
    enum: ['Mint', 'Near Mint', 'Excellent', 'Good', 'Light Play', 'Moderate Play', 'Heavy Play', 'Damaged'],
    default: 'Near Mint'
  },
  frontImage: {
    type: String,
    required: true
  },
  backImage: {
    type: String,
    required: true
  },
  frontImageData: {
    type: String,
    required: false
  },
  backImageData: {
    type: String,
    required: false
  },
  originalFrontPath: {
    type: String,
    required: false
  },
  originalBackPath: {
    type: String,
    required: false
  },
  estimatedValue: {
    type: Number,
    min: 0,
    default: null
  },
  ebayPrice: {
    type: Number,
    min: 0,
    default: null
  },
  tcgPlayerPrice: {
    type: Number,
    min: 0,
    default: null
  },
  lastPriceUpdate: {
    type: Date,
    default: null
  },
  needsPricing: {
    type: Boolean,
    default: true
  },
  processingStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  ocrData: {
    frontText: {
      type: String,
      default: ''
    },
    backText: {
      type: String,
      default: ''
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Index for efficient querying
CardSchema.index({ name: 1, set: 1 });
CardSchema.index({ needsPricing: 1 });
CardSchema.index({ processingStatus: 1 });
CardSchema.index({ createdAt: -1 });

// Virtual for getting image URL or base64 data
CardSchema.virtual('frontImageUrl').get(function() {
  if (this.frontImageData) {
    return `data:image/jpeg;base64,${this.frontImageData}`;
  }
  return this.frontImage;
});

CardSchema.virtual('backImageUrl').get(function() {
  if (this.backImageData) {
    return `data:image/jpeg;base64,${this.backImageData}`;
  }
  return this.backImage;
});

// Method to check if card has pricing data
CardSchema.methods.hasPricing = function(): boolean {
  return !!(this.ebayPrice || this.tcgPlayerPrice || this.estimatedValue);
};

// Method to get best available price
CardSchema.methods.getBestPrice = function(): number | null {
  if (this.ebayPrice) return this.ebayPrice;
  if (this.tcgPlayerPrice) return this.tcgPlayerPrice;
  if (this.estimatedValue) return this.estimatedValue;
  return null;
};

// Method to mark as needing pricing update
CardSchema.methods.markForPricingUpdate = function(): void {
  this.needsPricing = true;
  this.lastPriceUpdate = null;
};

// Pre-save middleware to update needsPricing flag
CardSchema.pre('save', function(next) {
  if (this.isModified('ebayPrice') || this.isModified('tcgPlayerPrice') || this.isModified('estimatedValue')) {
    if (this.hasPricing()) {
      this.needsPricing = false;
      this.lastPriceUpdate = new Date();
    }
  }
  next();
});

// Static method to find cards without pricing
CardSchema.statics.findWithoutPricing = function() {
  return this.find({ needsPricing: true });
};

// Static method to find cards by processing status
CardSchema.statics.findByProcessingStatus = function(status: string) {
  return this.find({ processingStatus: status });
};

export default mongoose.model<ICard>('Card', CardSchema);