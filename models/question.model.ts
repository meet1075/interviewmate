// models/Question.js

import { Schema, model, models } from "mongoose";

const questionSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  answer: { type: String, required: true },
  hints: [{ type: String }],
  domain: { type: String, required: true },
  difficulty: { 
    type: String, 
    required: true,
    enum: ['Beginner', 'Intermediate', 'Advanced']
  }
}, { timestamps: true });

const Question = models?.Question || model("Question", questionSchema);

export default Question;