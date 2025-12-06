# Database Schema

## Collections

### Users Collection
```javascript
{
  _id: ObjectId,
  username: String (required, unique, 3-30 chars),
  email: String (required, unique, lowercase),
  password: String (required, hashed, min 6 chars),
  preferences: {
    theme: String (enum: ['light', 'dark'], default: 'light'),
    language: String (default: 'en')
  },
  stats: {
    totalWords: Number (default: 0),
    correctPronunciations: Number (default: 0),
    totalAttempts: Number (default: 0),
    averageScore: Number (default: 0)
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Quizzes Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: 'User', required),
  sessionId: String (required, unique, UUID),
  extractedWords: [String] (required),
  wordResults: [{
    word: String (required),
    attempts: [{
      transcript: String,
      pronunciationScore: Number (0-100),
      spellingScore: Number (0-100),
      feedback: String,
      isCorrect: Boolean,
      timestamp: Date (default: now)
    }],
    finalScore: Number,
    completed: Boolean (default: false),
    mode: String (enum: ['pronounce', 'spell'], required)
  }],
  currentWordIndex: Number (default: 0),
  status: String (enum: ['active', 'completed', 'paused'], default: 'active'),
  mode: String (enum: ['pronounce', 'spell'], required),
  overallScore: Number,
  completedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## Indexes

### Users Collection Indexes
```javascript
// Unique indexes
db.users.createIndex({ "email": 1 }, { unique: true })
db.users.createIndex({ "username": 1 }, { unique: true })

// Performance indexes
db.users.createIndex({ "createdAt": -1 })
```

### Quizzes Collection Indexes
```javascript
// Unique indexes
db.quizzes.createIndex({ "sessionId": 1 }, { unique: true })

// Performance indexes
db.quizzes.createIndex({ "userId": 1, "createdAt": -1 })
db.quizzes.createIndex({ "status": 1 })
db.quizzes.createIndex({ "userId": 1, "status": 1 })

// Compound indexes for queries
db.quizzes.createIndex({ "userId": 1, "completedAt": -1 })
```

## Sample Data

### Sample User
```javascript
{
  "_id": ObjectId("..."),
  "username": "demo_user",
  "email": "demo@example.com",
  "password": "$2b$12$...", // hashed password
  "preferences": {
    "theme": "light",
    "language": "en"
  },
  "stats": {
    "totalWords": 150,
    "correctPronunciations": 120,
    "totalAttempts": 180,
    "averageScore": 85
  },
  "createdAt": ISODate("2024-01-01T00:00:00Z"),
  "updatedAt": ISODate("2024-01-15T10:30:00Z")
}
```

### Sample Quiz
```javascript
{
  "_id": ObjectId("..."),
  "userId": ObjectId("..."),
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "extractedWords": ["apple", "banana", "orange", "grape"],
  "wordResults": [
    {
      "word": "apple",
      "attempts": [
        {
          "transcript": "apple",
          "pronunciationScore": 95,
          "spellingScore": 100,
          "feedback": "Excellent pronunciation!",
          "isCorrect": true,
          "timestamp": ISODate("2024-01-15T10:00:00Z")
        }
      ],
      "finalScore": 97.5,
      "completed": true,
      "mode": "pronounce"
    },
    {
      "word": "banana",
      "attempts": [
        {
          "transcript": "bananna",
          "pronunciationScore": 75,
          "spellingScore": 80,
          "feedback": "Good attempt, watch the pronunciation of the middle syllable",
          "isCorrect": false,
          "timestamp": ISODate("2024-01-15T10:01:00Z")
        },
        {
          "transcript": "banana",
          "pronunciationScore": 90,
          "spellingScore": 100,
          "feedback": "Much better! Great improvement",
          "isCorrect": true,
          "timestamp": ISODate("2024-01-15T10:02:00Z")
        }
      ],
      "finalScore": 95,
      "completed": true,
      "mode": "pronounce"
    }
  ],
  "currentWordIndex": 2,
  "status": "active",
  "mode": "pronounce",
  "overallScore": null,
  "completedAt": null,
  "createdAt": ISODate("2024-01-15T09:55:00Z"),
  "updatedAt": ISODate("2024-01-15T10:02:00Z")
}
```

## Data Relationships

```
User (1) -----> (Many) Quiz
User.stats are calculated from Quiz results
Quiz.wordResults track individual word performance
Quiz.overallScore is calculated from wordResults.finalScore
```

## Performance Considerations

1. **Indexing Strategy**
   - Primary queries: user lookup, quiz history, active quizzes
   - Compound indexes for common query patterns
   - TTL indexes for temporary data if needed

2. **Data Size Management**
   - Quiz attempts are limited to 3 per word
   - Old quiz data can be archived after 1 year
   - Audio files are not stored in database

3. **Query Optimization**
   - Use projection to limit returned fields
   - Paginate quiz history results
   - Cache user stats for frequent access

## Migration Scripts

### Initial Setup
```javascript
// Create collections with validation
db.createCollection("users", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["username", "email", "password"],
      properties: {
        username: { bsonType: "string", minLength: 3, maxLength: 30 },
        email: { bsonType: "string", pattern: "^.+@.+\..+$" },
        password: { bsonType: "string", minLength: 6 }
      }
    }
  }
})

db.createCollection("quizzes", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["userId", "sessionId", "extractedWords", "mode"],
      properties: {
        mode: { enum: ["pronounce", "spell"] },
        status: { enum: ["active", "completed", "paused"] }
      }
    }
  }
})
```