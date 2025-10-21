const express = require('express');
const documentController = require('../controllers/documentController');
const authController = require('../controllers/authController');
const { documentValidators } = require('../middleware/validators');

const router = express.Router();

// Public routes
router
  .route('/')
  .get(documentController.getAllDocuments)
  .post(
    authController.protect,
    documentValidators.create,
    documentController.createDocument
  );

router.get('/within/:distance/center/:latlng/unit/:unit', 
  documentController.getDocumentsWithin
);

router.get('/stats', 
  authController.protect, 
  authController.restrictTo('admin'),
  documentController.getDocumentStats
);

router
  .route('/:id')
  .get(documentController.getDocument)
  .patch(
    authController.protect,
    documentValidators.update,
    documentController.updateDocument
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin'),
    documentController.deleteDocument
  );

module.exports = router;
