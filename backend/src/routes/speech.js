const express = require('express');
const multer = require('multer');
const path = require('path');
const speechService = require('../services/speechService');

const router = express.Router();

// Configure multer for audio uploads
const audioStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'audio-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const uploadAudio = multer({ 
  storage: audioStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /webm|wav|mp3|m4a/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype) || file.mimetype.includes('audio');
    
    if (mimetype || extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'));
    }
  }
});

/**
 * POST /api/speech/transcribe
 * Transcribe audio to text
 * 
 * Request: multipart/form-data with 'audio' field
 * Response: {
 *   success: true,
 *   transcript: "transcribed text"
 * }
 */
router.post('/transcribe', uploadAudio.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No audio file provided'
      });
    }

    const transcript = await speechService.transcribeAudio(req.file.path);

    res.json({
      success: true,
      transcript: transcript,
      message: 'Audio transcribed successfully'
    });

  } catch (error) {
    console.error('Speech transcription error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to transcribe audio'
    });
  }
});

/**
 * POST /api/speech/evaluate
 * Evaluate pronunciation/spelling
 * 
 * Request: {
 *   targetWord: "word",
 *   transcript: "user's attempt",
 *   mode: "pronounce" | "spell"
 * }
 * Response: {
 *   success: true,
 *   evaluation: {
 *     word: "word",
 *     transcript: "attempt",
 *     pronunciationScore: 85,
 *     spellingScore: 90,
 *     feedback: "Good job!",
 *     isCorrect: true,
 *     retry: false
 *   }
 * }
 */
router.post('/evaluate', async (req, res) => {
  try {
    const { targetWord, transcript, mode = 'pronounce' } = req.body;

    if (!targetWord || !transcript) {
      return res.status(400).json({
        success: false,
        error: 'Target word and transcript are required'
      });
    }

    if (!['pronounce', 'spell'].includes(mode)) {
      return res.status(400).json({
        success: false,
        error: 'Mode must be either "pronounce" or "spell"'
      });
    }

    const evaluation = await speechService.evaluatePronunciation(targetWord, transcript, mode);

    res.json({
      success: true,
      evaluation: evaluation,
      message: 'Evaluation completed successfully'
    });

  } catch (error) {
    console.error('Speech evaluation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to evaluate pronunciation'
    });
  }
});

/**
 * POST /api/speech/transcribe-and-evaluate
 * Combined endpoint: transcribe audio and evaluate pronunciation
 * 
 * Request: multipart/form-data with 'audio' field and form data:
 *   - targetWord: string
 *   - mode: "pronounce" | "spell"
 * Response: {
 *   success: true,
 *   transcript: "transcribed text",
 *   evaluation: { ... }
 * }
 */
router.post('/transcribe-and-evaluate', uploadAudio.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No audio file provided'
      });
    }

    const { targetWord, mode = 'pronounce' } = req.body;

    if (!targetWord) {
      return res.status(400).json({
        success: false,
        error: 'Target word is required'
      });
    }

    // Transcribe audio
    const transcript = await speechService.transcribeAudio(req.file.path);
    
    // Evaluate pronunciation
    const evaluation = await speechService.evaluatePronunciation(targetWord, transcript, mode);

    res.json({
      success: true,
      transcript: transcript,
      evaluation: evaluation,
      message: 'Audio processed and evaluated successfully'
    });

  } catch (error) {
    console.error('Speech processing error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process audio'
    });
  }
});

module.exports = router;