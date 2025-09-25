import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { OpenAI } from "openai";
import connectDb from "@/dbconfig/db";
import User from "@/models/user.model";
import { MockSession } from "@/models/practicesession.model";
import sessionStorage from "@/utils/sessionStorage";

// Initialize the AI client
const client = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

export async function POST(request: Request, { params }: { params: { sessionId: string } }) {
  try {
    console.log("Complete session API called for session:", params.sessionId);
    
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

    if (!session.answers || session.answers.length === 0) {
      return new NextResponse("No answers found for this session", { status: 400 });
    }

    console.log("Processing session completion for", session.answers.length, "answers");

    // 4. Calculate overall statistics
    const totalQuestions = session.questions.length;
    const answeredQuestions = session.answers.length;
    const ratings = session.answers.map((a: any) => a.rating);
    const averageRating = ratings.reduce((sum: number, rating: number) => sum + rating, 0) / ratings.length;
    const totalTimeSpent = session.answers.reduce((sum: number, answer: any) => sum + answer.timeSpent, 0);

    // 5. Use AI to generate overall feedback
    const systemPrompt = `
        You are an expert interviewer providing overall feedback for a mock interview session.
        
        You'll receive:
        - Domain/Technology
        - Difficulty level
        - Individual question performance data
        - Overall statistics
        
        ### Task:
        - Provide comprehensive overall feedback about the candidate's performance
        - Highlight key strengths and areas for improvement
        - Give specific advice for future interviews
        - Be encouraging but honest about weaknesses
        - Provide actionable next steps
        
        Return output strictly in JSON format:
        {
          "overallFeedback": "string (3-4 sentences)",
          "strengths": ["string", "string"],
          "improvements": ["string", "string"],
          "recommendations": ["string", "string"]
        }
    `;

    const performanceData = {
      domain: session.domain,
      difficulty: session.difficulty,
      totalQuestions: totalQuestions,
      answeredQuestions: answeredQuestions,
      averageRating: averageRating,
      totalTime: totalTimeSpent,
      individualAnswers: session.answers.map((answer: any) => ({
        rating: answer.rating,
        timeSpent: answer.timeSpent,
        feedback: answer.feedback
      }))
    };

    const userPrompt = JSON.stringify(performanceData);

    const response = await client.chat.completions.create({
      model: "gemini-2.0-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.9
    });

    const overallFeedback = JSON.parse(response.choices[0].message.content || '{}');

    // 6. Save the session to database
    const mockSession = new MockSession({
      userId: user._id,
      domain: session.domain,
      difficulty: session.difficulty,
      questions: session.questions,
      answers: session.answers,
      overallRating: averageRating,
      totalTimeSpent: totalTimeSpent,
      overallFeedback: overallFeedback.overallFeedback || "Session completed successfully",
      strengths: overallFeedback.strengths || [],
      improvements: overallFeedback.improvements || [],
      recommendations: overallFeedback.recommendations || [],
      completedAt: new Date()
    });

    await mockSession.save();

    // 7. Clean up session from memory
    sessionStorage.delete(params.sessionId);

    console.log("Session completed and saved to database");

    return NextResponse.json({
      sessionId: params.sessionId,
      overallRating: Math.round(averageRating * 10) / 10,
      totalQuestions: totalQuestions,
      answeredQuestions: answeredQuestions,
      totalTimeSpent: totalTimeSpent,
      overallFeedback: overallFeedback.overallFeedback,
      strengths: overallFeedback.strengths,
      improvements: overallFeedback.improvements,
      recommendations: overallFeedback.recommendations,
      individualAnswers: session.answers,
      message: "Mock interview session completed successfully"
    });

  } catch (error) {
    console.error("[COMPLETE_SESSION_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}