import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { OpenAI } from "openai";
import connectDb from "@/dbconfig/db";
import User from "@/models/user.model";
import { MockSession } from "@/models/practicesession.model";
import sessionStorage from "@/utils/sessionStorage";

// Initialize the AI client
const client = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

export async function POST(request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  try {
    // Await params before using its properties
    const { sessionId } = await params;
    console.log("Submit answer API called for session:", sessionId);
    
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

    // 4. Get the session from database first, then try memory as fallback
    console.log("=== SUBMIT ANSWER DEBUG ===");
    console.log("Looking for session:", sessionId);
    console.log("User ID:", userId);
    console.log("User DB ID:", user._id);
    
    let session;
    
    // First, try to get from database using sessionId
    try {
      console.log("Searching database for sessionId:", sessionId);
      const dbSession = await MockSession.findOne({ sessionId: sessionId });
      console.log("Database query result:", dbSession ? "FOUND" : "NOT FOUND");
      
      if (dbSession) {
        console.log("Session found in database - Details:");
        console.log("- DB ID:", dbSession._id);
        console.log("- Session ID:", dbSession.sessionId);
        console.log("- User ID:", dbSession.userId);
        console.log("- Domain:", dbSession.domain);
        console.log("- Questions count:", dbSession.questions?.length || 0);
        console.log("- Answers count:", dbSession.answers?.length || 0);
        
        session = {
          questions: dbSession.questions,
          answers: dbSession.answers || [],
          domain: dbSession.domain,
          difficulty: dbSession.difficulty,
          userId: dbSession.userId
        };
        
        // Also store in memory for future requests
        sessionStorage.set(sessionId, session);
        console.log("Session cached in memory");
      } else {
        console.log("No session found in database with sessionId:", sessionId);
        
        // Let's also check if there are any sessions for this user
        const userSessions = await MockSession.find({ userId: user._id }).sort({ createdAt: -1 }).limit(5);
        console.log("Recent sessions for this user:", userSessions.map(s => ({
          sessionId: s.sessionId,
          createdAt: s.createdAt
        })));
      }
    } catch (dbError) {
      console.error("Database lookup failed:", dbError);
    }
    
    // Fallback to memory storage
    if (!session) {
      console.log("Trying memory storage as fallback");
      session = sessionStorage.get(sessionId);
      console.log("Memory storage result:", session ? "FOUND" : "NOT FOUND");
    }
    
    if (!session) {
      console.error("=== SESSION NOT FOUND ===");
      console.error("SessionId searched:", sessionId);
      console.error("User:", user.email);
      console.error("No session found in database or memory");
      return new NextResponse("Session not found", { status: 404 });
    }
    
    console.log("Session found! Questions count:", session.questions?.length);

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
    
    // Save to both memory and database
    sessionStorage.set(sessionId, session);
    
    // Update database as well
    try {
      await MockSession.findOneAndUpdate(
        { sessionId: sessionId },
        { $push: { answers: answerData } }
      );
      console.log("Answer saved to database");
    } catch (dbError) {
      console.error("Failed to save answer to database:", dbError);
      // Continue anyway since we have it in memory
    }

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