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
    questions: [{
    type: Schema.Types.ObjectId,
    ref: 'Question'
  }]
}, { timestamps: true });

const PracticeSession = models?.PracticeSession || model("PracticeSession", practiceSessionSchema);

export default PracticeSession;