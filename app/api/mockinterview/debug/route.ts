import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectDb from "@/dbconfig/db";
import User from "@/models/user.model";
import { MockSession } from "@/models/practicesession.model";

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
      return new NextResponse("User not found", { status: 404 });
    }

    // 3. Get all sessions from database
    const dbSessions = await MockSession.find({ userId: user._id }).sort({ createdAt: -1 });
    
    // 4. Get memory sessions (this is a bit tricky since sessionStorage doesn't expose all keys)
    // For debugging, we'll just return what we can access
    
    console.log("=== MOCK INTERVIEW DEBUG ===");
    console.log("User ID:", userId);
    console.log("User DB ID:", user._id);
    console.log("Database sessions count:", dbSessions.length);
    console.log("Database sessions:", dbSessions.map(s => ({
      _id: s._id,
      sessionId: s.sessionId,
      domain: s.domain,
      difficulty: s.difficulty,
      questionsCount: s.questions?.length || 0,
      answersCount: s.answers?.length || 0,
      createdAt: s.createdAt
    })));

    return NextResponse.json({
      user: {
        clerkId: userId,
        dbId: user._id.toString(),
        email: user.email
      },
      databaseSessions: dbSessions.map(s => ({
        _id: s._id,
        sessionId: s.sessionId,
        domain: s.domain,
        difficulty: s.difficulty,
        questionsCount: s.questions?.length || 0,
        answersCount: s.answers?.length || 0,
        createdAt: s.createdAt
      })),
      totalSessions: dbSessions.length
    });

  } catch (error) {
    console.error("[DEBUG_SESSIONS_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}