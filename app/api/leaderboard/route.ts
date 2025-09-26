import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectDb from "@/dbconfig/db";
import User from "@/models/user.model";

export async function GET(request: Request) {
  try {
    // 1. Authenticate the user
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // 2. Connect to the database
    await connectDb();

    // 3. Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const page = parseInt(searchParams.get("page") || "1");
    const skip = (page - 1) * limit;

    // 4. Get leaderboard data - users sorted by total points
    const leaderboard = await User.find(
      { status: 'active', totalPoints: { $gt: 0 } }, // Only active users with points
      {
        clerkId: 1,
        userName: 1,
        firstName: 1,
        lastName: 1,
        profileImage: 1,
        totalPoints: 1,
        practiceSessionsCompleted: 1,
        mockInterviewsCompleted: 1,
        createdAt: 1
      }
    )
    .sort({ totalPoints: -1, createdAt: 1 }) // Sort by points desc, then by join date
    .skip(skip)
    .limit(limit);

    // 5. Get current user's position in leaderboard
    const currentUser = await User.findOne({ clerkId: userId });
    let currentUserRank = null;
    
    if (currentUser && currentUser.totalPoints > 0) {
      const higherRankedUsers = await User.countDocuments({
        status: 'active',
        totalPoints: { $gt: currentUser.totalPoints }
      });
      
      // Users with same points, ranked by join date
      const samePointsEarlierUsers = await User.countDocuments({
        status: 'active',
        totalPoints: currentUser.totalPoints,
        createdAt: { $lt: currentUser.createdAt }
      });
      
      currentUserRank = higherRankedUsers + samePointsEarlierUsers + 1;
    }

    // 6. Get total number of users with points for pagination
    const totalUsers = await User.countDocuments({ 
      status: 'active', 
      totalPoints: { $gt: 0 } 
    });

    // 7. Add rank to each user
    const leaderboardWithRanks = leaderboard.map((user, index) => ({
      ...user.toObject(),
      rank: skip + index + 1
    }));

    return NextResponse.json({
      leaderboard: leaderboardWithRanks,
      currentUserRank,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalUsers / limit),
        totalUsers,
        hasNextPage: page < Math.ceil(totalUsers / limit),
        hasPrevPage: page > 1
      }
    }, { status: 200 });

  } catch (error) {
    console.error("[LEADERBOARD_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}