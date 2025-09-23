// models/Question.js

import { Schema, model, models } from "mongoose";

const questionSchema = new Schema({
  title: { type: String, required: true },
  
  answer: { type: String, required: true },
    
  domain: { type: String, required: true },
  difficulty: { type: String, required: true },
  
  practiceSession: {
    type: Schema.Types.ObjectId,
    ref: 'PracticeSession',
    required: true
  }
}, { timestamps: true });

const Question = models?.Question || model("Question", questionSchema);

export default Question;