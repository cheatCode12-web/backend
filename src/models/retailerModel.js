const mongoose = require('mongoose');

const retailerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Retailer name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  address: {
    street: {
      type: String,
      required: [true, 'Street address is required']
    },
    city: {
      type: String,
      required: [true, 'City is required']
    },
    state: {
      type: String,
      required: [true, 'State is required']
    },
    zipCode: {
      type: String,
      required: [true, 'ZIP code is required']
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      default: 'Nigeria'
    }
  },
  businessName: {
    type: String,
    required: [true, 'Business name is required'],
    trim: true
  },
  businessType: {
    type: String,
    required: [true, 'Business type is required'],
    enum: ['Grocery', 'Electronics', 'Fashion', 'Food & Beverage', 'Health & Beauty', 'Other']
  },
  registrationNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  joinedDate: {
    type: Date,
    default: Date.now
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  bankDetails: {
    bankName: String,
    accountNumber: String,
    accountName: String
  },
  metrics: {
    totalSales: {
      type: Number,
      default: 0
    },
    totalOrders: {
      type: Number,
      default: 0
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    }
  }
}, {
  timestamps: true
});

// Update lastUpdated timestamp before saving
retailerSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

// Create indexes for frequent queries
retailerSchema.index({ email: 1 });
retailerSchema.index({ 'address.city': 1 });
retailerSchema.index({ businessType: 1 });
retailerSchema.index({ status: 1 });

const Retailer = mongoose.model('Retailer', retailerSchema);

export default Retailer;