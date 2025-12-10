import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { OpenAI } from "openai";
import connectDb from "@/dbconfig/db";
import User from "@/models/user.model";
import { MockSession } from "@/models/practicesession.model";
import sessionStorage from "@/utils/sessionStorage";

// Initialize the AI client
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  try {
    // Await params before using its properties
    const { sessionId } = await params;
    console.log("Complete session API called for session:", sessionId);
    
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
        console.log("Session found in database for completion");
        session = {
          questions: dbSession.questions,
          answers: dbSession.answers || [],
          domain: dbSession.domain,
          difficulty: dbSession.difficulty,
          userId: dbSession.userId
        };
      }
    } catch (dbError) {
      console.log("Database lookup failed, trying memory:", dbError);
    }
    
    // Fallback to memory storage
    if (!session) {
      console.log("Trying memory storage as fallback for completion");
      session = sessionStorage.get(sessionId);
    }
    
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
    const ratings = session.answers.map((a: { rating: number }) => a.rating);
    const averageRating = ratings.reduce((sum: number, rating: number) => sum + rating, 0) / ratings.length;
    const totalTimeSpent = session.answers.reduce((sum: number, answer: { timeSpent: number }) => sum + answer.timeSpent, 0);

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
      individualAnswers: session.answers.map((answer: { rating: number; timeSpent: number; feedback: string }) => ({
        rating: answer.rating,
        timeSpent: answer.timeSpent,
        feedback: answer.feedback
      }))
    };

    const userPrompt = JSON.stringify(performanceData);

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.9
    });

    const overallFeedback = JSON.parse(response.choices[0].message.content || '{}');

    // 6. Update the existing session in database instead of creating a new one
    try {
      await MockSession.findOneAndUpdate(
        { sessionId: sessionId },
        {
          $set: {
            overallRating: averageRating,
            totalTimeSpent: totalTimeSpent,
            overallFeedback: overallFeedback.overallFeedback || "Session completed successfully",
            strengths: overallFeedback.strengths || [],
            improvements: overallFeedback.improvements || [],
            recommendations: overallFeedback.recommendations || [],
            completedAt: new Date()
          }
        },
        { new: true }
      );
      console.log("Session completion data updated in database");
    } catch (updateError) {
      console.error("Failed to update session completion in database:", updateError);
      // If update fails, create a new completed session record
      const mockSession = new MockSession({
        sessionId: sessionId + "_completed", // Add suffix to avoid duplicate
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
      console.log("Created new completed session record");
    }

    // 7. Award points to user based on performance and difficulty
    const pointsMap = {
      'Beginner': 20,
      'Intermediate': 30,
      'Advanced': 40
    };
    const basePoints = pointsMap[session.difficulty as keyof typeof pointsMap] || 20;
    // Bonus points based on rating (0-10 scale -> 0-10 bonus points)
    const bonusPoints = Math.round(averageRating);
    const totalPoints = basePoints + bonusPoints;
    
    // Update user's total points and mock interviews completed
    await User.findByIdAndUpdate(user._id, {
      $inc: { 
        totalPoints: totalPoints,
        mockInterviewsCompleted: 1
      }
    });

    // 8. Clean up session from memory
    sessionStorage.delete(sessionId);

    console.log("Session completed and saved to database");

    return NextResponse.json({
      sessionId: sessionId,
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