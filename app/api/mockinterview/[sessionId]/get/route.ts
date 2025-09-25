import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectDb from "@/dbconfig/db";
import User from "@/models/user.model";
import sessionStorage from "@/utils/sessionStorage";

export async function GET(request: Request, { params }: { params: { sessionId: string } }) {
  try {
    console.log("Get session API called for session:", params.sessionId);
    
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

    // 3. Get the session from memory
    const session = sessionStorage.get(params.sessionId);
    if (!session) {
      return new NextResponse("Session not found", { status: 404 });
    }

    console.log("Session found, returning details");

    return NextResponse.json({
      sessionId: params.sessionId,
      domain: session.domain,
      difficulty: session.difficulty,
      questions: session.questions,
      answers: session.answers || [],
      createdAt: session.createdAt,
      currentQuestionIndex: session.answers ? session.answers.length : 0
    });

  } catch (error) {
    console.error("[GET_SESSION_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}