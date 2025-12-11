import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { OpenAI } from "openai";
import "dotenv/config";

import connectDb from "@/dbconfig/db";
import User from "@/models/user.model";
import Question from "@/models/question.model";
import PracticeSession from "@/models/practicesession.model";
import Domain from "@/models/domain.model";

// Initialize the AI client
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
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

    // 4. Generate initial 3 questions using the AI for fast response
    const systemPrompt = `
        You are an expert AI assistant for generating Tech interview questions with detailed answers.
        Your task is to generate exactly {count} questions based on the given domain and difficulty level.
        
        ### Rules:
        1. Strictly return the output in **valid JSON format**.
        2. The JSON structure must be: { "questions": [{ "title": "string", "description": "string", "answer": "string", "hints": ["string", "string"] }] }
        3. Each question's "title" should be a concise summary of the question.
        4. The "description" should be the full question text.
        5. The "answer" should be a comprehensive, well-structured answer to the question.
        6. Provide 2-3 helpful "hints" for each question.
        7. Ensure questions match the selected difficulty level.
        8. Do not include any extra explanation outside the JSON.
    `;

    const generateQuestions = async (count: number) => {
      const userPrompt = `Generate ${count} interview questions for the domain: ${domain}, difficulty level: ${difficulty}.`;
      
      const response = await client.chat.completions.create({
        model: "gpt-4o-mini", 
        messages: [
          { role: "system", content: systemPrompt.replace('{count}', count.toString()) },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.8,
      });
      
      const aiResponse = JSON.parse(response.choices[0].message.content || '{}');
      return aiResponse.questions || [];
    };

    // Generate initial 3 questions
    let initialQuestions;
    try {
      initialQuestions = await generateQuestions(3);
    } catch (aiError: unknown) {
      console.error("AI API Error:", aiError);
      
      // Check if it's a rate limit error (429)
      if (aiError && typeof aiError === 'object' && 'status' in aiError && aiError.status === 429) {
        return new NextResponse(
          JSON.stringify({ 
            error: "Rate limit exceeded. Please wait a moment and try again.",
            code: "RATE_LIMIT"
          }), 
          { 
            status: 429,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
      
      // Other AI errors
      return new NextResponse(
        JSON.stringify({ 
          error: "Failed to generate questions. Please try again.",
          code: "AI_ERROR"
        }), 
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    if (!initialQuestions || initialQuestions.length === 0) {
        return new NextResponse(
          JSON.stringify({ 
            error: "AI failed to generate questions",
            code: "NO_QUESTIONS"
          }), 
          { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          }
        );
    }

    // 5. Save the initial questions to the database
    const newQuestionDocs = await Question.insertMany(
      initialQuestions.map((q: { title: string; description: string; answer: string; hints?: string[]; domain?: string; difficulty?: string }) => ({
        title: q.title,
        description: q.description,
        answer: q.answer,
        hints: q.hints,
        domain,
        difficulty,
      }))
    );
    
    const questionIds = newQuestionDocs.map(doc => doc._id);
    
    // 5.a Update Domain.questionsCount to reflect newly inserted practice questions
    try {
      await Domain.findOneAndUpdate(
        { name: domain },
        { $inc: { questionsCount: questionIds.length } }
      );
    } catch (err) {
      console.error("Failed to update Domain.questionsCount:", err);
      // continue anyway
    }

    // 6. Create and save the new practice session
    const newPracticeSession = new PracticeSession({
        user: user._id,
        domain,
        difficulty,
        questions: questionIds,
        totalQuestions: 10, // Total will be 10 after background generation
        completedQuestions: 0,
        status: 'in-progress',
    });

    await newPracticeSession.save();

    // Populate the questions to send the full data back to the frontend
    await newPracticeSession.populate('questions');

    // 7. Generate remaining 7 questions in the background (non-blocking)
    // Using setImmediate to ensure it runs after response is sent
    setImmediate(async () => {
      try {
        const remainingQuestions = await generateQuestions(7);
        
        if (remainingQuestions && remainingQuestions.length > 0) {
          // Save remaining questions
          const additionalQuestionDocs = await Question.insertMany(
            remainingQuestions.map((q: { title: string; description: string; answer: string; hints?: string[]; domain?: string; difficulty?: string }) => ({
              title: q.title,
              description: q.description,
              answer: q.answer,
              hints: q.hints,
              domain,
              difficulty,
            }))
          );
          
          const additionalQuestionIds = additionalQuestionDocs.map(doc => doc._id);
          
          // Update the practice session with new questions
          await PracticeSession.findByIdAndUpdate(newPracticeSession._id, {
            $push: { questions: { $each: additionalQuestionIds } }
          });
          
          // Update domain question count
          await Domain.findOneAndUpdate(
            { name: domain },
            { $inc: { questionsCount: additionalQuestionIds.length } }
          );
          
          console.log(`[BACKGROUND] Generated ${additionalQuestionIds.length} additional questions for session ${newPracticeSession._id}`);
        }
      } catch (error) {
        console.error("[BACKGROUND_GENERATION_ERROR]", error);
        // Background generation failure is non-critical, user already has 3 questions
      }
    });

    return NextResponse.json(newPracticeSession, { status: 201 });

  } catch (error) {
    console.error("[PRACTICE_SESSION_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function GET() {
  try {
    // 1. Authenticate the user
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

    // 3. Get all practice sessions for the user
    const sessions = await PracticeSession.find({ user: user._id })
      .populate('questions')
      .sort({ createdAt: -1 }) // Most recent first
      .limit(10); // Limit to last 10 sessions

    return NextResponse.json({ sessions }, { status: 200 });

  } catch (error) {
    console.error("[GET_PRACTICE_SESSIONS_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

