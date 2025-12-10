import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectDb from "@/dbconfig/db";
import User from "@/models/user.model";
import { MockSession } from "@/models/practicesession.model";

export async function GET(request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  try {
    const { sessionId } = await params;
    console.log("Test endpoint called for session:", sessionId);
    
    // 1. Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized", userId: null }, { status: 401 });
    }

    // 2. Check database connection
    await connectDb();
    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      return NextResponse.json({ error: "User not found", userId }, { status: 404 });
    }

    // 3. Check session existence
    const dbSession = await MockSession.findOne({ sessionId: sessionId });
    
    // 4. Check environment variables
    const hasMongoUrl = !!process.env.MONGODB_URL;

    return NextResponse.json({
      status: "success",
      sessionId,
      userId,
      userEmail: user.email,
      sessionFound: !!dbSession,
      sessionData: dbSession ? {
        id: dbSession._id,
        domain: dbSession.domain,
        difficulty: dbSession.difficulty,
        questionsCount: dbSession.questions?.length || 0,
        answersCount: dbSession.answers?.length || 0
      } : null,
      environment: {
        hasOpenAIKey: !!process.env.OPENAI_API_KEY,
        hasMongoUrl,
        nodeEnv: process.env.NODE_ENV
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("[TEST_ENDPOINT_ERROR]", error);
    return NextResponse.json({
      error: "Internal Server Error",
      details: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}