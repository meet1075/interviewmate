import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectDb from "@/dbconfig/db";
import User from "@/models/user.model";
import Question from "@/models/question.model";

export async function GET() {
  try {
    // 1. Authenticate the user
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // 2. Connect to the database
    await connectDb();
    const user = await User.findOne({ clerkId: userId }).populate('bookmarkedQuestions');
    
    // If user doesn't exist yet (new user), return empty bookmarks array
    if (!user) {
      return NextResponse.json({ bookmarks: [] });
    }

    // 3. Transform the bookmarked questions to match frontend interface
    const bookmarks = user.bookmarkedQuestions.map((question: any) => ({
      id: question._id.toString(),
      title: question.title,
      description: question.description,
      answer: question.answer,
      hints: question.hints,
      domain: question.domain,
      difficulty: question.difficulty
    }));

    return NextResponse.json({ bookmarks });

  } catch (error) {
    console.error("[BOOKMARKS_GET_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // 1. Authenticate the user
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // 2. Connect to the database
    await connectDb();
    let user = await User.findOne({ clerkId: userId });
    
    // If user doesn't exist yet (race condition with webhook), return error to retry
    if (!user) {
      return new NextResponse("User not found. Please try again in a moment.", { status: 404 });
    }

    // 3. Get question ID from request body
    const { id } = await request.json();
    
    // 4. Check if question exists
    const question = await Question.findById(id);
    if (!question) {
      return new NextResponse("Question not found", { status: 404 });
    }
    
    // 5. Add question to bookmarks if not already bookmarked
    const isAlreadyBookmarked = user.bookmarkedQuestions.some(
      (questionId: any) => questionId.toString() === id
    );

    if (!isAlreadyBookmarked) {
      user.bookmarkedQuestions.push(question._id);
      await user.save();
    }

    return NextResponse.json({ message: "Question bookmarked successfully" });

  } catch (error) {
    console.error("[BOOKMARKS_POST_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(request: Request) {
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
      return new NextResponse("User not found. Please try again in a moment.", { status: 404 });
    }

    // 3. Get question ID from request body
    const { questionId } = await request.json();
    
    // 4. Remove question from bookmarks
    user.bookmarkedQuestions = user.bookmarkedQuestions.filter(
      (id: any) => id.toString() !== questionId
    );
    await user.save();

    return NextResponse.json({ message: "Bookmark removed successfully" });

  } catch (error) {
    console.error("[BOOKMARKS_DELETE_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}