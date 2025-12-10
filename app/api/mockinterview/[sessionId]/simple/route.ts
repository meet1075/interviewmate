import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectDb from "@/dbconfig/db";
import User from "@/models/user.model";
import { MockSession } from "@/models/practicesession.model";
import sessionStorage from "@/utils/sessionStorage";

export async function POST(request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  console.log("=== SIMPLIFIED SUBMIT ANSWER ENDPOINT ===");
  
  try {
    // Step 1: Get sessionId
    const { sessionId } = await params;
    console.log("✓ SessionId extracted:", sessionId);
    
    // Step 2: Check authentication
    const { userId } = await auth();
    console.log("✓ Authentication check:", userId ? "SUCCESS" : "FAILED");
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    // Step 3: Parse request body
    const body = await request.json();
    console.log("✓ Request body parsed:", Object.keys(body));
    const { questionId, answer, timeSpent } = body;
    
    // Step 4: Validate required fields
    if (!questionId || !answer || timeSpent === undefined) {
      console.log("✗ Missing fields:", { questionId: !!questionId, answer: !!answer, timeSpent });
      return new NextResponse("Missing required fields", { status: 400 });
    }
    console.log("✓ All required fields present");
    
    // Step 5: Connect to database
    await connectDb();
    console.log("✓ Database connected");
    
    // Step 6: Find user
    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      console.log("✗ User not found for clerkId:", userId);
      return new NextResponse("User not found", { status: 404 });
    }
    console.log("✓ User found:", user.email);
    
    // Step 7: Find session (try database first)
    let session = null;
    try {
      const dbSession = await MockSession.findOne({ sessionId: sessionId });
      if (dbSession) {
        console.log("✓ Session found in database");
        session = {
          questions: dbSession.questions,
          answers: dbSession.answers || [],
          domain: dbSession.domain,
          difficulty: dbSession.difficulty,
          userId: dbSession.userId
        };
      } else {
        console.log("! Session not found in database, trying memory");
        session = sessionStorage.get(sessionId);
        if (session) {
          console.log("✓ Session found in memory");
        } else {
          console.log("✗ Session not found in memory either");
        }
      }
    } catch (dbError) {
      console.log("! Database error, trying memory:", dbError);
      session = sessionStorage.get(sessionId);
    }
    
    if (!session) {
      console.log("✗ No session found anywhere");
      return new NextResponse("Session not found", { status: 404 });
    }
    
    // Step 8: Find question
    const question = session.questions.find((q: { id: string }) => q.id === questionId);
    if (!question) {
      console.log("✗ Question not found:", questionId);
      return new NextResponse("Question not found", { status: 404 });
    }
    console.log("✓ Question found:", question.title);
    
    // Step 9: Simple evaluation (no AI for now)
    const evaluation = {
      rating: Math.floor(Math.random() * 5) + 5, // Random rating 5-9
      feedback: "Answer submitted successfully. Using simplified evaluation."
    };
    console.log("✓ Evaluation completed:", evaluation.rating);
    
    // Step 10: Store answer
    if (!session.answers) {
      session.answers = [];
    }
    
    const answerData = {
      questionId: questionId,
      answer: answer,
      rating: evaluation.rating,
      feedback: evaluation.feedback,
      timeSpent: timeSpent
    };
    
    session.answers.push(answerData);
    sessionStorage.set(sessionId, session);
    console.log("✓ Answer stored in memory");
    
    // Step 11: Try to update database
    try {
      await MockSession.findOneAndUpdate(
        { sessionId: sessionId },
        { $push: { answers: answerData } }
      );
      console.log("✓ Answer saved to database");
    } catch (dbError) {
      console.log("! Database save failed (but continuing):", dbError);
    }
    
    console.log("=== SUCCESS ===");
    return NextResponse.json({
      rating: evaluation.rating,
      feedback: evaluation.feedback,
      message: "Answer submitted successfully (simplified version)"
    });
    
  } catch (error) {
    console.error("=== ERROR ===", error);
    if (error instanceof Error) {
      console.error("Error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack?.split('\n').slice(0, 5).join('\n')
      });
    }
    return new NextResponse("Internal Server Error: " + (error instanceof Error ? error.message : "Unknown error"), { status: 500 });
  }
}