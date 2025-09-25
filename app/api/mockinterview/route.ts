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

export async function POST(request: Request) {
  try {
    console.log("Mock interview API called");
    
    // 1. Authenticate the user
    const { userId } = await auth();
    if (!userId) {
      console.log("No user ID found");
      return new NextResponse("Unauthorized", { status: 401 });
    }
    console.log("User authenticated:", userId);

    // 2. Connect to the database
    await connectDb();
    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      console.log("User not found in database");
      return new NextResponse("User not found in DB", { status: 404 });
    }
    console.log("User found:", user.email);

    // 3. Get domain and difficulty from the request body
    const body = await request.json();
    console.log("Request body:", body);
    
    const { domain, difficulty } = body;
    if (!domain || !difficulty) {
      console.log("Missing domain or difficulty");
      return new NextResponse("Domain and difficulty are required", { status: 400 });
    }

    // 4. Generate questions using AI
    console.log("Generating questions for:", domain, difficulty);
    const systemPrompt = `
        You are an expert AI assistant for generating Tech interview questions and answers.  
        Your task is to generate exactly 5 questions and their answers based on the given domain and difficulty level.  

        ### Rules:
        1. If domain given by user is not suitable or not relevant for interview then give reason that domain is not valid for tech interview
        2. Strictly return the output in **valid JSON format**.  
        3. JSON structure must be:
        {
            "questions": [
            {
                "id": number,
                "title": "string",
                "description": "string", 
                "referenceAnswer": "string",
                "timeLimit": number
            }
            ]
        }
        4. Each question must match the selected difficulty level (${difficulty}).  
        5. Reference answers must be **brief, detailed, clear, and properly summarized**.  
        6. If a question can include an example, then include one (but keep the answer concise).
        7. timeLimit should be in minutes (3-8 minutes based on complexity and difficulty)
        8. Do not include any extra explanation outside the JSON.
    `;

    const userPrompt = `Generate interview questions for the domain: ${domain}, difficulty level: ${difficulty}.`;

    const response = await client.chat.completions.create({
        model: "gemini-2.0-flash", 
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.8,
    });

    console.log("AI response received");
    const aiResponse = JSON.parse(response.choices[0].message.content || '{}');
    const generatedQuestions = aiResponse.questions;

    if (!generatedQuestions || generatedQuestions.length === 0) {
      console.log("No questions generated");
      return new NextResponse("AI failed to generate questions", { status: 500 });
    }

    console.log("Generated questions:", generatedQuestions.length);

    // 5. Create a session ID
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 6. Transform the response to match frontend interface
    const sessionResponse = {
      id: sessionId,
      userId: user._id.toString(),
      domain: domain,
      difficulty: difficulty,
      questions: generatedQuestions.map((q: any) => ({
        id: `q_${q.id}_${Date.now()}`,
        title: q.title,
        description: q.description,
        referenceAnswer: q.referenceAnswer,
        domain: domain,
        difficulty: difficulty,
        timeLimit: q.timeLimit || (difficulty === 'Beginner' ? 3 : difficulty === 'Intermediate' ? 5 : 8)
      })),
      answers: [],
      startTime: new Date().toISOString(),
      overallRating: 0,
      overallFeedback: '',
      pointsEarned: 0,
      status: 'active'
    };

    // 7. Store session in memory for later access
    sessionStorage.set(sessionId, {
      ...sessionResponse,
      createdAt: new Date().toISOString()
    });

    console.log("Session stored and returning response");
    return NextResponse.json({
      sessionId: sessionId,
      userId: user._id.toString(),
      domain: domain,
      difficulty: difficulty,
      questions: sessionResponse.questions,
      message: "Mock interview session created successfully"
    }, { status: 201 });

  } catch (error) {
    console.error("[MOCK_INTERVIEW_ERROR]", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}