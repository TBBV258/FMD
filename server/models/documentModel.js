const mongoose = require('mongoose');
const validator = require('validator');

const documentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a title'],
      trim: true,
      maxlength: [100, 'Title cannot be more than 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    documentType: {
      type: String,
      required: [true, 'Please specify the document type'],
      enum: {
        values: ['ID', 'PASSPORT', 'DRIVER_LICENSE', 'OTHER'],
        message: 'Document type is either: ID, PASSPORT, DRIVER_LICENSE, or OTHER',
      },
    },
    documentNumber: {
      type: String,
      trim: true,
      maxlength: [50, 'Document number cannot exceed 50 characters'],
    },
    status: {
      type: String,
      enum: ['LOST', 'FOUND', 'RETURNED', 'IN_PROGRESS'],
      default: 'LOST',
    },
    lostDate: {
      type: Date,
      required: [
        function() {
          return this.status === 'LOST' || this.status === 'FOUND';
        },
        'Please provide the date when the document was lost or found',
      ],
    },
    location: {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number], // [longitude, latitude]
      address: String,
      description: String,
    },
    images: [String],
    owner: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Document must belong to a user'],
    },
    foundBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
    contactInfo: {
      name: String,
      email: {
        type: String,
        validate: [validator.isEmail, 'Please provide a valid email'],
      },
      phone: String,
    },
    isAnonymous: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index for geospatial queries
documentSchema.index({ location: '2dsphere' });

// Populate owner and foundBy fields
documentSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'owner',
    select: 'name email phone',
  }).populate({
    path: 'foundBy',
    select: 'name email phone',
  });
  next();
});

// Static method to get documents within a radius
documentSchema.statics.findWithinRadius = async function(coordinates, radius) {
  return await this.find({
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates,
        },
        $maxDistance: radius * 1000, // Convert km to meters
      },
    },
  });
};

// Virtual for document URL
documentSchema.virtual('url').get(function() {
  return `/api/documents/${this._id}`;
});

const Document = mongoose.model('Document', documentSchema);

module.exports = Document;
