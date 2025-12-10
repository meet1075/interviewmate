import { NextResponse } from "next/server";

export async function GET() {
  try {
    return NextResponse.json({
      status: "API is working",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      hasOpenAIKey: !!process.env.OPENAI_API_KEY,
      hasMongoUrl: !!process.env.MONGODB_URL
    });
  } catch (error) {
    console.error("Health check error:", error);
    return NextResponse.json({
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    return NextResponse.json({
      status: "POST working",
      receivedData: body,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("POST test error:", error);
    return NextResponse.json({
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}