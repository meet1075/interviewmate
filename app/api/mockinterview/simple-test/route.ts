import { NextResponse } from "next/server";
import connectDb from "@/dbconfig/db";
import { MockSession } from "@/models/practicesession.model";

export async function GET() {
  try {
    await connectDb();
    
    const testSessionId = `simple_test_${Date.now()}`;
    console.log("Creating simple test session:", testSessionId);
    
    // Create a minimal session
    const session = new MockSession({
      sessionId: testSessionId,
      userId: "507f1f77bcf86cd799439011", // Dummy ObjectId
      domain: "Test",
      difficulty: "Beginner",
      questions: []
    });
    
    await session.save();
    console.log("Session saved");
    
    // Try to find it
    const found = await MockSession.findOne({ sessionId: testSessionId });
    console.log("Session found:", !!found);
    
    // Clean up
    if (found) {
      await MockSession.findByIdAndDelete(found._id);
      console.log("Test session cleaned up");
    }
    
    return NextResponse.json({
      success: true,
      testSessionId,
      sessionSaved: true,
      sessionFound: !!found
    });
    
  } catch (error) {
    console.error("Simple test failed:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}