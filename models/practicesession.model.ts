import { Schema, model, models } from "mongoose";

const practiceSessionSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  domain: { type: String, required: true },
  difficulty: { type: String, required: true },
  totalQuestions: { type: Number, default: 10 },
  completedQuestions: { type: Number, default: 0 },
  currentQuestionIndex: { type: Number, default: 0 },
  status: { 
    type: String, 
    enum: ['in-progress', 'completed', 'abandoned'],
    default: 'in-progress'
  },
  questions: [{
    type: Schema.Types.ObjectId,
    ref: 'Question'
  }]
}, { timestamps: true });

// Mock Session Schema for AI-powered interview sessions
const mockSessionSchema = new Schema({
  sessionId: { type: String, required: true, unique: true }, // Add custom sessionId field
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  domain: { type: String, required: true },
  difficulty: { 
    type: String, 
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    required: true 
  },
  questions: [{
    id: String,
    title: String,
    domain: String,
    difficulty: String,
    description: String,
    timeLimit: Number,
    referenceAnswer: String
  }],
  answers: [{
    questionId: String,
    answer: String,
    rating: { type: Number, min: 1, max: 10 },
    feedback: String,
    timeSpent: Number
  }],
  overallRating: { type: Number, default: 0 },
  totalTimeSpent: { type: Number, default: 0 },
  overallFeedback: String,
  strengths: [String],
  improvements: [String],
  recommendations: [String],
  completedAt: Date
}, { timestamps: true });

// Add indexes for better query performance
mockSessionSchema.index({ sessionId: 1 }, { unique: true });
mockSessionSchema.index({ userId: 1, createdAt: -1 });

const PracticeSession = models?.PracticeSession || model("PracticeSession", practiceSessionSchema);
const MockSession = models?.MockSession || model("MockSession", mockSessionSchema);

export default PracticeSession;
export { MockSession };