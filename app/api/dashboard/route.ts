import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectDb from "@/dbconfig/db";
import User from "@/models/user.model";
import PracticeSession from "@/models/practicesession.model";
import { MockSession } from "@/models/practicesession.model";

export async function GET() {
  try {
    console.log("Dashboard API called");
    
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

    console.log("Fetching dashboard data for user:", user.email);

    // 4. Fetch Practice Sessions
    const practiceSessions = await PracticeSession.find({ user: user._id })
      .populate('questions')
      .sort({ createdAt: -1 });

    console.log("Found practice sessions:", practiceSessions.length);

    // 5. Fetch Mock Interview Sessions
    const mockSessions = await MockSession.find({ userId: user._id })
      .sort({ createdAt: -1 });

    console.log("Found mock sessions:", mockSessions.length);

    // 6. Calculate Practice Questions Total
    // For now, let's count total questions in sessions since completedQuestions might not be updated
    const totalPracticeQuestions = practiceSessions.reduce((total, session) => {
      // Use totalQuestions instead of completedQuestions as a temporary fix
      return total + (session.totalQuestions || 0);
    }, 0);
    
    console.log("Practice sessions data:", practiceSessions.map(s => ({
      id: s._id,
      domain: s.domain,
      totalQuestions: s.totalQuestions,
      completedQuestions: s.completedQuestions,
      questionsCount: s.questions?.length
    })));

    // 7. Calculate Mock Interviews Total
    const completedMockSessions = mockSessions.filter(session => session.completedAt);
    const totalMockInterviews = completedMockSessions.length;

    // 8. Calculate Total Points from Mock Interviews
    const totalPoints = completedMockSessions.reduce((total, session) => {
      return total + Math.round((session.overallRating || 0) * 10);
    }, 0);

    // 9. Get Bookmarked Questions Count
    // The field is 'bookmarkedQuestions' not 'bookmarks'
    let bookmarkedCount = 0;
    try {
      if (user.bookmarkedQuestions && Array.isArray(user.bookmarkedQuestions)) {
        bookmarkedCount = user.bookmarkedQuestions.length;
        console.log("Found bookmarked questions:", bookmarkedCount);
      } else {
        bookmarkedCount = 0;
        console.log("No bookmarked questions found or field doesn't exist");
      }
    } catch (error) {
      console.log("Error accessing bookmarked questions:", error);
      bookmarkedCount = 0;
    }

    // 10. Calculate Skill Progress by Domain
    const domainStats: Record<string, {
      totalRating: number;
      sessionCount: number;
    }> = {};
    
    completedMockSessions.forEach(session => {
      const domain = session.domain;
      const rating = session.overallRating || 0;
      
      if (!domainStats[domain]) {
        domainStats[domain] = {
          totalRating: 0,
          sessionCount: 0
        };
      }
      
      domainStats[domain].totalRating += rating;
      domainStats[domain].sessionCount += 1;
    });

    const skillProgress = Object.entries(domainStats).map(([domain, stats]) => ({
      skill: domain,
      level: Math.round((stats.totalRating / stats.sessionCount) * 10), // Convert to percentage
      questions: stats.sessionCount,
      averageRating: Math.round((stats.totalRating / stats.sessionCount) * 10) / 10
    }));

    // 11. Get Recent Activity (last 4 activities)
    interface ActivityItem {
      id: string;
      type: 'Practice' | 'Mock Interview';
      domain: string;
      difficulty: string;
      completedQuestions?: number;
      totalQuestions?: number;
      overallRating?: number;
      pointsEarned?: number;
      date: Date;
      timestamp: Date;
      startTime: Date;
      status?: 'completed' | 'active';
    }
    
    const recentActivity: ActivityItem[] = [];

    // Add practice sessions to activity
    practiceSessions.slice(0, 5).forEach(session => {
      recentActivity.push({
        id: session._id.toString(),
        type: 'Practice',
        domain: session.domain,
        difficulty: session.difficulty,
        completedQuestions: session.completedQuestions,
        totalQuestions: session.totalQuestions,
        date: session.createdAt,
        timestamp: session.createdAt,
        startTime: session.createdAt
      });
    });

    // Add mock sessions to activity
    mockSessions.slice(0, 5).forEach(session => {
      recentActivity.push({
        id: session._id.toString(),
        type: 'Mock Interview',
        domain: session.domain,
        difficulty: session.difficulty,
        overallRating: session.overallRating || 0,
        pointsEarned: Math.round((session.overallRating || 0) * 10),
        date: session.createdAt,
        timestamp: session.createdAt,
        startTime: session.createdAt,
        status: session.completedAt ? 'completed' : 'active'
      });
    });

    // Sort by date and take last 4
    const sortedActivity = recentActivity
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 4);

    // 12. Prepare response data
    const dashboardData = {
      user: {
        id: user._id.toString(),
        clerkId: userId,
        email: user.email,
        username: user.username || user.firstName || user.email.split('@')[0]
      },
      stats: {
        practiceQuestions: totalPracticeQuestions,
        mockInterviews: totalMockInterviews,
        totalPoints: totalPoints,
        bookmarkedQuestions: bookmarkedCount
      },
      skillProgress: skillProgress,
      recentActivity: sortedActivity,
      summary: {
        totalSessions: practiceSessions.length + mockSessions.length,
        completedMockSessions: completedMockSessions.length,
        averageRating: completedMockSessions.length > 0 
          ? Math.round((completedMockSessions.reduce((sum, s) => sum + (s.overallRating || 0), 0) / completedMockSessions.length) * 10) / 10
          : 0
      }
    };

    console.log("Dashboard data prepared successfully");
    console.log("Stats:", dashboardData.stats);
    console.log("Skill progress:", dashboardData.skillProgress);
    console.log("Recent activity count:", dashboardData.recentActivity.length);
    console.log("User bookmarked questions field:", user.bookmarkedQuestions);
    console.log("Practice sessions found:", practiceSessions.length);
    console.log("Mock sessions found:", mockSessions.length);

    return NextResponse.json(dashboardData);

  } catch (error) {
    console.error("[DASHBOARD_API_ERROR]", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}