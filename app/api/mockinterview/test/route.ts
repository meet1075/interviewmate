import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectDb from "@/dbconfig/db";
import User from "@/models/user.model";
import { MockSession } from "@/models/practicesession.model";

export async function POST() {
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

    // 3. Create a test session
    const testSessionId = `test_session_${Date.now()}`;
    
    console.log("Creating test session:", testSessionId);
    
    const testSession = new MockSession({
      sessionId: testSessionId,
      userId: user._id,
      domain: "Frontend Development",
      difficulty: "Beginner",
      questions: [{
        id: "test_q_1",
        title: "Test Question",
        description: "This is a test question",
        referenceAnswer: "This is a test answer",
        domain: "Frontend Development",
        difficulty: "Beginner",
        timeLimit: 5
      }]
    });

    const savedSession = await testSession.save();
    console.log("Test session saved:", savedSession._id);

    // 4. Try to find it back
    const foundSession = await MockSession.findOne({ sessionId: testSessionId });
    console.log("Found session:", foundSession ? "YES" : "NO");

    // 5. Clean up the test session
    await MockSession.findByIdAndDelete(savedSession._id);
    console.log("Test session cleaned up");

    return NextResponse.json({
      message: "Database test successful",
      sessionCreated: !!savedSession,
      sessionFound: !!foundSession,
      testSessionId: testSessionId
    });

  } catch (error) {
    console.error("[TEST_SESSION_ERROR]", error);
    return NextResponse.json({
      error: "Database test failed",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}