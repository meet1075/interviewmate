import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectDb from "@/dbconfig/db";
import User from "@/models/user.model";
import PracticeSession from "@/models/practicesession.model";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Await params before using its properties
    const { id } = await params;
    console.log("Update practice session API called for session:", id);
    
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

    // 3. Get update data from request body
    const { completedQuestions, currentQuestionIndex } = await request.json();

    // 4. Determine if session is completed
    const updateData: {
      completedQuestions: number;
      currentQuestionIndex: number;
      updatedAt: Date;
      status?: string;
    } = {
      completedQuestions: completedQuestions,
      currentQuestionIndex: currentQuestionIndex,
      updatedAt: new Date()
    };

    // If all questions are completed, mark as completed and award points
    const session = await PracticeSession.findById(id);
    if (session && completedQuestions >= session.totalQuestions && session.status !== 'completed') {
      updateData.status = 'completed';
      
      // Award points based on difficulty
      const pointsMap = {
        'Beginner': 10,
        'Intermediate': 15,
        'Advanced': 20
      };
      const points = pointsMap[session.difficulty as keyof typeof pointsMap] || 10;
      
      // Update user's total points and practice sessions completed
      await User.findByIdAndUpdate(user._id, {
        $inc: { 
          totalPoints: points,
          practiceSessionsCompleted: 1
        }
      });
    }

    // 5. Find and update the practice session
    const updatedSession = await PracticeSession.findOneAndUpdate(
      { _id: id, user: user._id },
      { $set: updateData },
      { new: true }
    ).populate('questions');

    if (!updatedSession) {
      return new NextResponse("Practice session not found", { status: 404 });
    }

    console.log("Practice session updated:", updatedSession._id);

    return NextResponse.json({
      message: "Practice session updated successfully",
      session: {
        id: session._id,
        completedQuestions: session.completedQuestions,
        totalQuestions: session.totalQuestions,
        currentQuestionIndex: session.currentQuestionIndex || 0
      }
    });

  } catch (error) {
    console.error("[UPDATE_PRACTICE_SESSION_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Await params before using its properties
    const { id } = await params;
    console.log("Get practice session API called for session:", id);
    
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

    // 3. Find the practice session
    const session = await PracticeSession.findOne({ _id: id, user: user._id })
      .populate('questions');

    if (!session) {
      return new NextResponse("Practice session not found", { status: 404 });
    }

    console.log("Practice session found:", session._id);

    // 4. Transform to frontend format
    const sessionData = {
      id: session._id,
      domain: session.domain,
      difficulty: session.difficulty,
      questions: session.questions.map((q: { _id: string; title: string; description: string; answer: string; domain: string; difficulty: string; hints?: string[] }) => ({
        id: q._id,
        title: q.title,
        description: q.description,
        answer: q.answer,
        hints: q.hints,
        domain: q.domain,
        difficulty: q.difficulty
      })),
      currentQuestionIndex: session.currentQuestionIndex || 0,
      startTime: session.createdAt,
      completedQuestions: session.completedQuestions,
      totalQuestions: session.totalQuestions
    };

    return NextResponse.json(sessionData);

  } catch (error) {
    console.error("[GET_PRACTICE_SESSION_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}