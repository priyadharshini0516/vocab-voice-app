const express = require('express');
const multer = require('multer');
const path = require('path');
const ocrService = require('../services/ocrService');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'image-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only JPEG and PNG images are allowed'));
    }
  }
});

/**
 * POST /api/ocr/extract
 * Extract text from uploaded image
 * 
 * Request: multipart/form-data with 'image' field
 * Response: {
 *   success: true,
 *   words: ["word1", "word2", ...],
 *   totalWords: number
 * }
 */
router.post('/extract', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided'
      });
    }

    await ocrService.validateImage(req.file);
    const words = await ocrService.extractTextFromImage(req.file.path);

    if (words.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No readable text found in the image'
      });
    }

    res.json({
      success: true,
      words: words,
      totalWords: words.length,
      message: `Successfully extracted ${words.length} words`
    });

  } catch (error) {
    console.error('OCR extraction error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process image'
    });
  }
});

/**
 * GET /api/ocr/health
 * Health check for OCR service
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'OCR',
    status: 'operational',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;