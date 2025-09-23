import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { OpenAI } from "openai";
import "dotenv/config";

import connectDb from "@/dbconfig/db";
import User from "@/models/user.model";
import Question from "@/models/question.model";
import PracticeSession from "@/models/practicesession.model";

// Initialize the AI client
const client = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

export async function POST(request: Request) {
  try {
    // 1. Authenticate the user by awaiting the auth() function
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // 2. Connect to the database
    await connectDb();
    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      return new NextResponse("User not found in DB", { status: 404 });
    }

    // 3. Get domain and difficulty from the request body
    const { domain, difficulty } = await request.json();
    if (!domain || !difficulty) {
      return new NextResponse("Domain and difficulty are required", { status: 400 });
    }

    // 4. Generate questions using the AI
    const systemPrompt = `
        You are an expert AI assistant for generating Tech interview questions.
        Your task is to generate exactly 10 questions based on the given domain and difficulty level.
        
        ### Rules:
        1. Strictly return the output in **valid JSON format**.
        2. The JSON structure must be: { "questions": [{ "title": "string", "description": "string", "hints": ["string", "string"] }] }
        3. Each question's "title" should be a concise summary of the question.
        4. The "description" should be the full question text.
        5. Provide 2-3 helpful "hints" for each question.
        6. Ensure questions match the selected difficulty level.
        7. Do not include any extra explanation outside the JSON.
    `;

    const userPrompt = `Generate 10 interview questions for the domain: ${domain}, difficulty level: ${difficulty}.`;

    const response = await client.chat.completions.create({
        model: "gemini-1.5-flash", 
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.8,
    });

    const aiResponse = JSON.parse(response.choices[0].message.content || '{}');
    const generatedQuestions = aiResponse.questions;

    if (!generatedQuestions || generatedQuestions.length === 0) {
        return new NextResponse("AI failed to generate questions", { status: 500 });
    }

    // 5. Save the new questions to the database
    const newQuestionDocs = await Question.insertMany(
      generatedQuestions.map((q: any) => ({
        title: q.title,
        description: q.description,
        hints: q.hints,
        domain,
        difficulty,
      }))
    );
    
    const questionIds = newQuestionDocs.map(doc => doc._id);

    // 6. Create and save the new practice session
    const newPracticeSession = new PracticeSession({
        user: user._id,
        domain,
        difficulty,
        questions: questionIds,
        totalQuestions: questionIds.length,
        completedQuestions: 0,
        status: 'in-progress',
    });

    await newPracticeSession.save();

    // Populate the questions to send the full data back to the frontend
    await newPracticeSession.populate('questions');

    return NextResponse.json(newPracticeSession, { status: 201 });

  } catch (error) {
    console.error("[PRACTICE_SESSION_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

