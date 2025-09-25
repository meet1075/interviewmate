import { NextResponse } from "next/server";
import connectDb from "@/dbconfig/db";
import { MockSession } from "@/models/practicesession.model";

export async function GET(request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  try {
    const { sessionId } = await params;
    await connectDb();
    
    console.log("Checking session existence:", sessionId);
    
    const session = await MockSession.findOne({ sessionId: sessionId });
    
    return NextResponse.json({
      sessionId,
      exists: !!session,
      details: session ? {
        _id: session._id,
        sessionId: session.sessionId,
        userId: session.userId,
        domain: session.domain,
        difficulty: session.difficulty,
        questionsCount: session.questions?.length || 0,
        answersCount: session.answers?.length || 0,
        createdAt: session.createdAt
      } : null
    });
    
  } catch (error) {
    console.error("Session check failed:", error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}