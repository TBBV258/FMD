const Document = require('../models/documentModel');
const { createHttpError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

// Helper function for filtering fields
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

// @desc    Get all documents
// @route   GET /api/documents
// @access  Public
exports.getAllDocuments = async (req, res, next) => {
  try {
    // 1) Basic filtering
    const queryObj = { ...req.query };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((el) => delete queryObj[el]);

    // 2) Advanced filtering
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
    
    let query = Document.find(JSON.parse(queryStr));

    // 3) Sorting
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt');
    }

    // 4) Field limiting
    if (req.query.fields) {
      const fields = req.query.fields.split(',').join(' ');
      query = query.select(fields);
    } else {
      query = query.select('-__v');
    }

    // 5) Pagination
    const page = req.query.page * 1 || 1;
    const limit = req.query.limit * 1 || 100;
    const skip = (page - 1) * limit;

    query = query.skip(skip).limit(limit);

    if (req.query.page) {
      const numDocuments = await Document.countDocuments();
      if (skip >= numDocuments) throw new Error('This page does not exist');
    }

    // EXECUTE QUERY
    const documents = await query;

    // SEND RESPONSE
    res.status(200).json({
      status: 'success',
      results: documents.length,
      data: {
        documents,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get documents within a certain distance
// @route   GET /api/documents/within/:distance/center/:latlng/unit/:unit
// @access  Public
exports.getDocumentsWithin = async (req, res, next) => {
  try {
    const { distance, latlng, unit } = req.params;
    const [lat, lng] = latlng.split(',');
    const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

    if (!lat || !lng) {
      return next(
        createHttpError(400, 'Please provide latitude and longitude in the format lat,lng')
      );
    }

    const documents = await Document.find({
      location: {
        $geoWithin: { $centerSphere: [[lng, lat], radius] },
      },
    });

    res.status(200).json({
      status: 'success',
      results: documents.length,
      data: {
        data: documents,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a document
// @route   POST /api/documents
// @access  Private
exports.createDocument = async (req, res, next) => {
  try {
    // Allow nested routes
    if (!req.body.owner) req.body.owner = req.user.id;

    const newDocument = await Document.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        document: newDocument,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single document
// @route   GET /api/documents/:id
// @access  Public
exports.getDocument = async (req, res, next) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return next(createHttpError(404, 'No document found with that ID'));
    }

    res.status(200).json({
      status: 'success',
      data: {
        document,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a document
// @route   PATCH /api/documents/:id
// @access  Private
exports.updateDocument = async (req, res, next) => {
  try {
    const document = await Document.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!document) {
      return next(createHttpError(404, 'No document found with that ID'));
    }

    res.status(200).json({
      status: 'success',
      data: {
        document,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a document
// @route   DELETE /api/documents/:id
// @access  Private
exports.deleteDocument = async (req, res, next) => {
  try {
    const document = await Document.findByIdAndDelete(req.params.id);

    if (!document) {
      return next(createHttpError(404, 'No document found with that ID'));
    }

    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get document stats
// @route   GET /api/documents/stats
// @access  Private/Admin
exports.getDocumentStats = async (req, res, next) => {
  try {
    const stats = await Document.aggregate([
      {
        $match: { status: { $ne: 'RETURNED' } },
      },
      {
        $group: {
          _id: '$documentType',
          numDocuments: { $sum: 1 },
          numFound: {
            $sum: { $cond: [{ $eq: ['$status', 'FOUND'] }, 1, 0] },
          },
          numLost: {
            $sum: { $cond: [{ $eq: ['$status', 'LOST'] }, 1, 0] },
          },
          avgReward: { $avg: '$reward' },
        },
      },
      {
        $sort: { numDocuments: -1 },
      },
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        stats,
      },
    });
  } catch (error) {
    next(error);
  }
};
