import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectDb from "@/dbconfig/db";
import User from "@/models/user.model";
import { MockSession } from "@/models/practicesession.model";
import sessionStorage from "@/utils/sessionStorage";

export async function GET(request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  try {
    // Await params before using its properties
    const { sessionId } = await params;
    console.log("Get session API called for session:", sessionId);
    
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

    // 3. Get the session from database first, then try memory as fallback
    let session;
    
    // First, try to get from database using sessionId
    try {
      const dbSession = await MockSession.findOne({ sessionId: sessionId });
      if (dbSession) {
        console.log("Session found in database");
        session = {
          sessionId: sessionId,
          domain: dbSession.domain,
          difficulty: dbSession.difficulty,
          questions: dbSession.questions,
          answers: dbSession.answers || [],
          createdAt: dbSession.createdAt,
          currentQuestionIndex: dbSession.answers ? dbSession.answers.length : 0
        };
        
        // Also store in memory for future requests
        sessionStorage.set(sessionId, session);
      }
    } catch (dbError) {
      console.log("Database lookup failed, trying memory:", dbError);
    }
    
    // Fallback to memory storage
    if (!session) {
      console.log("Trying memory storage as fallback");
      const memorySession = sessionStorage.get(sessionId);
      if (memorySession) {
        session = {
          sessionId: sessionId,
          domain: memorySession.domain,
          difficulty: memorySession.difficulty,
          questions: memorySession.questions,
          answers: memorySession.answers || [],
          createdAt: memorySession.createdAt,
          currentQuestionIndex: memorySession.answers ? memorySession.answers.length : 0
        };
      }
    }
    
    if (!session) {
      return new NextResponse("Session not found", { status: 404 });
    }

    console.log("Session found, returning details");

    return NextResponse.json(session);

  } catch (error) {
    console.error("[GET_SESSION_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}