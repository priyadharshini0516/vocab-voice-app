const express = require('express');
const Quiz = require('../models/Quiz');
const crypto = require('crypto');

// Generate UUID v4
const uuidv4 = () => {
  return crypto.randomUUID();
};

const router = express.Router();

// Create quiz
router.post('/create', async (req, res) => {
  try {
    const { userId, words, mode = 'pronounce' } = req.body;

    if (!userId || !words || !Array.isArray(words) || words.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'User ID and words array are required'
      });
    }

    const sessionId = uuidv4();
    
    const quiz = new Quiz({
      userId,
      sessionId,
      extractedWords: words,
      mode,
      wordResults: words.map(word => ({
        word,
        attempts: [],
        mode,
        completed: false
      }))
    });

    await quiz.save();

    res.json({
      success: true,
      quiz: {
        sessionId: quiz.sessionId,
        totalWords: words.length,
        currentWordIndex: 0,
        currentWord: words[0],
        mode: quiz.mode
      }
    });

  } catch (error) {
    console.error('Quiz creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create quiz session'
    });
  }
});

// Get quiz
router.get('/:sessionId', async (req, res) => {
  try {
    const quiz = await Quiz.findOne({ sessionId: req.params.sessionId });

    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: 'Quiz session not found'
      });
    }

    const currentWord = quiz.extractedWords[quiz.currentWordIndex];
    const progress = Math.round((quiz.currentWordIndex / quiz.extractedWords.length) * 100);

    res.json({
      success: true,
      quiz: {
        sessionId: quiz.sessionId,
        totalWords: quiz.extractedWords.length,
        currentWordIndex: quiz.currentWordIndex,
        currentWord: currentWord,
        mode: quiz.mode,
        status: quiz.status,
        progress: progress,
        completedWords: quiz.wordResults.filter(wr => wr.completed).length
      }
    });

  } catch (error) {
    console.error('Quiz fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch quiz session'
    });
  }
});

// Submit attempt
router.post('/:sessionId/attempt', async (req, res) => {
  try {
    const { transcript, pronunciationScore, spellingScore, feedback, isCorrect } = req.body;
    
    const quiz = await Quiz.findOne({ sessionId: req.params.sessionId });

    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: 'Quiz session not found'
      });
    }

    const currentWordResult = quiz.wordResults[quiz.currentWordIndex];
    
    // Add attempt
    currentWordResult.attempts.push({
      transcript,
      pronunciationScore,
      spellingScore,
      feedback,
      isCorrect
    });

    // Mark completed if correct or max attempts
    if (isCorrect || currentWordResult.attempts.length >= 3) {
      currentWordResult.completed = true;
      currentWordResult.finalScore = Math.max(...currentWordResult.attempts.map(a => 
        (a.pronunciationScore + a.spellingScore) / 2
      ));
    }

    await quiz.save();

    // Determine next action
    let nextAction = 'retry';
    let nextWord = null;
    
    if (currentWordResult.completed) {
      if (quiz.currentWordIndex < quiz.extractedWords.length - 1) {
        quiz.currentWordIndex++;
        nextAction = 'next_word';
        nextWord = quiz.extractedWords[quiz.currentWordIndex];
        await quiz.save();
      } else {
        quiz.status = 'completed';
        quiz.completedAt = new Date();
        quiz.overallScore = Math.round(
          quiz.wordResults.reduce((sum, wr) => sum + (wr.finalScore || 0), 0) / quiz.wordResults.length
        );
        await quiz.save();
        nextAction = 'quiz_completed';
      }
    }

    res.json({
      success: true,
      result: {
        isCorrect,
        feedback,
        scores: { pronunciationScore, spellingScore },
        nextAction,
        nextWord,
        progress: Math.round(((quiz.currentWordIndex + (currentWordResult.completed ? 1 : 0)) / quiz.extractedWords.length) * 100),
        attemptsLeft: Math.max(0, 3 - currentWordResult.attempts.length)
      }
    });

  } catch (error) {
    console.error('Quiz attempt error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit attempt'
    });
  }
});

// Get results
router.get('/:sessionId/results', async (req, res) => {
  try {
    const quiz = await Quiz.findOne({ sessionId: req.params.sessionId });

    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: 'Quiz session not found'
      });
    }

    const results = {
      sessionId: quiz.sessionId,
      overallScore: quiz.overallScore,
      totalWords: quiz.extractedWords.length,
      completedWords: quiz.wordResults.filter(wr => wr.completed).length,
      correctWords: quiz.wordResults.filter(wr => wr.attempts.some(a => a.isCorrect)).length,
      mode: quiz.mode,
      completedAt: quiz.completedAt,
      wordDetails: quiz.wordResults.map(wr => ({
        word: wr.word,
        finalScore: wr.finalScore,
        attempts: wr.attempts.length,
        completed: wr.completed,
        bestAttempt: wr.attempts.length > 0 ? wr.attempts.reduce((best, current) => 
          (current.pronunciationScore + current.spellingScore) > (best.pronunciationScore + best.spellingScore) 
            ? current : best, wr.attempts[0]) : null
      }))
    };

    res.json({
      success: true,
      results
    });

  } catch (error) {
    console.error('Quiz results error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch quiz results'
    });
  }
});

// Get user quiz history
router.get('/user/:userId/history', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const quizzes = await Quiz.find({ userId: req.params.userId })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('sessionId overallScore extractedWords completedAt mode status');

    const total = await Quiz.countDocuments({ userId: req.params.userId });

    // Format response
    const formattedQuizzes = quizzes.map(quiz => ({
      sessionId: quiz.sessionId,
      overallScore: quiz.overallScore || 0,
      totalWords: quiz.extractedWords ? quiz.extractedWords.length : 0,
      completedAt: quiz.completedAt,
      createdAt: quiz.createdAt,
      mode: quiz.mode,
      status: quiz.status
    }));

    res.json({
      success: true,
      history: formattedQuizzes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Quiz history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch quiz history'
    });
  }
});

module.exports = router;