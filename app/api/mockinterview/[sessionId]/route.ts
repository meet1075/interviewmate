import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { OpenAI } from "openai";
import connectDb from "@/dbconfig/db";
import User from "@/models/user.model";
import sessionStorage from "@/utils/sessionStorage";

// Initialize the AI client
const client = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

export async function POST(request: Request, { params }: { params: { sessionId: string } }) {
  try {
    console.log("Submit answer API called for session:", params.sessionId);
    
    // 1. Authenticate the user
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // 2. Connect to the database
    await connectDb();
    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    // 3. Get answer data from request body
    const { questionId, answer, timeSpent } = await request.json();
    if (!questionId || !answer || timeSpent === undefined) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    console.log("Received answer for question:", questionId);

    // 4. Get the session from memory (in production, get from database)
    const session = sessionStorage.get(params.sessionId);
    if (!session) {
      return new NextResponse("Session not found", { status: 404 });
    }

    // 5. Find the question
    const question = session.questions.find((q: any) => q.id === questionId);
    if (!question) {
      return new NextResponse("Question not found", { status: 404 });
    }

    // 6. Use AI to judge the answer and provide feedback
    const systemPrompt = `
        You are an expert interviewer evaluating candidate answers.  
        You will be given:
        - The question
        - The AI reference answer
        - The user's answer

        ### Task:
        - Compare the user's answer with the reference answer carefully.
        - Be strict and unbiased in your evaluation.
        - Give a rating from 1-10 based purely on the accuracy, completeness, and relevance of the answer.
        - Provide honest, detailed feedback (2-3 sentences) pointing out strengths and weaknesses.
        - Do NOT inflate ratings or give generic feedback.

        Return output strictly in JSON format:
        {
          "rating": number,
          "feedback": "string"
        }
    `;

    const userPrompt = JSON.stringify({ 
      question: question.title + " - " + question.description, 
      referenceAnswer: question.referenceAnswer, 
      userAnswer: answer 
    });

    const response = await client.chat.completions.create({
      model: "gemini-2.0-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.9
    });

    const evaluation = JSON.parse(response.choices[0].message.content || '{}');

    // 7. Store the answer in the session
    if (!session.answers) {
      session.answers = [];
    }

    const answerData = {
      questionId: questionId,
      answer: answer,
      rating: evaluation.rating || 1,
      feedback: evaluation.feedback || "No feedback provided",
      timeSpent: timeSpent
    };

    session.answers.push(answerData);
    sessionStorage.set(params.sessionId, session);

    console.log("Answer evaluated and stored");

    return NextResponse.json({
      rating: evaluation.rating,
      feedback: evaluation.feedback,
      message: "Answer submitted successfully"
    });

  } catch (error) {
    console.error("[SUBMIT_ANSWER_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}