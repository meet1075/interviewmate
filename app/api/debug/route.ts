import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectDb from "@/dbconfig/db";
import User from "@/models/user.model";
import PracticeSession from "@/models/practicesession.model";
import { MockSession } from "@/models/practicesession.model";

export async function GET() {
  try {
    console.log("Debug API called");
    
    // 1. Authenticate the user
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // 2. Connect to the database
    await connectDb();
    
    // 3. Find the user in the database
    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    console.log("User found:", user.email);
    console.log("User bookmarkedQuestions field exists:", !!user.bookmarkedQuestions);
    console.log("User bookmarkedQuestions type:", typeof user.bookmarkedQuestions);
    console.log("User bookmarkedQuestions length:", user.bookmarkedQuestions?.length);
    console.log("User bookmarkedQuestions content:", user.bookmarkedQuestions);

    // 4. Check practice sessions
    const practiceSessions = await PracticeSession.find({ user: user._id });
    console.log("Practice sessions found:", practiceSessions.length);
    console.log("Practice sessions:", practiceSessions.map(s => ({
      id: s._id,
      domain: s.domain,
      difficulty: s.difficulty,
      totalQuestions: s.totalQuestions,
      completedQuestions: s.completedQuestions,
      createdAt: s.createdAt
    })));

    // 5. Check mock sessions
    const mockSessions = await MockSession.find({ userId: user._id });
    console.log("Mock sessions found:", mockSessions.length);

    return NextResponse.json({
      message: "Debug data logged to console",
      user: {
        id: user._id,
        email: user.email,
        bookmarkedQuestionsCount: user.bookmarkedQuestions?.length || 0,
        bookmarkedQuestionsType: typeof user.bookmarkedQuestions,
        bookmarkedQuestionsExists: !!user.bookmarkedQuestions
      },
      counts: {
        practiceSessions: practiceSessions.length,
        mockSessions: mockSessions.length
      }
    });

  } catch (error) {
    console.error("[DEBUG_API_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}