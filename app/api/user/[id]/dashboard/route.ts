import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectDb from "@/dbconfig/db";
import User from "@/models/user.model";
import PracticeSession from "@/models/practicesession.model";
import { MockSession } from "@/models/practicesession.model";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Await params before using its properties
    const { id } = await params;
    console.log("Dashboard API called for user:", id);
    
    // 1. Authenticate the user
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // 2. Connect to the database
    await connectDb();
    
    // 3. Find the authenticated user in the database
    const authenticatedUser = await User.findOne({ clerkId: userId });
    if (!authenticatedUser) {
      return new NextResponse("User not found", { status: 404 });
    }

    // 4. Find the target user (the one whose dashboard we want to view)
    const targetUser = await User.findById(id);
    if (!targetUser) {
      return new NextResponse("Target user not found", { status: 404 });
    }

    // 5. Check permissions: user can view their own dashboard OR admin can view any dashboard
    const isOwnDashboard = id === userId || id === authenticatedUser._id.toString();
    const isAdmin = authenticatedUser.role === 'admin';
    
    if (!isOwnDashboard && !isAdmin) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Use the target user for dashboard data (not the authenticated user)
    const user = targetUser;

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
    const totalPracticeQuestions = practiceSessions.reduce((total, session) => {
      return total + (session.completedQuestions || 0);
    }, 0);

    // 7. Calculate Mock Interviews Total
    const completedMockSessions = mockSessions.filter(session => session.completedAt);
    const totalMockInterviews = completedMockSessions.length;

    // 8. Calculate Total Points from Mock Interviews
    const totalPoints = completedMockSessions.reduce((total, session) => {
      return total + Math.round((session.overallRating || 0) * 10);
    }, 0);

    // 9. Get Bookmarked Questions Count
    // The field is 'bookmarkedQuestions' not 'bookmarks'
    const bookmarkedCount = user.bookmarkedQuestions ? user.bookmarkedQuestions.length : 0;

    // 10. Calculate Skill Progress by Domain
    const domainStats: Record<string, {
      totalRating: number;
      sessionCount: number;
      sessions: number;
    }> = {};
    
    completedMockSessions.forEach(session => {
      const domain = session.domain;
      const rating = session.overallRating || 0;
      
      if (!domainStats[domain]) {
        domainStats[domain] = {
          totalRating: 0,
          sessionCount: 0,
          sessions: 0
        };
      }
      
      domainStats[domain].totalRating += rating;
      domainStats[domain].sessionCount += 1;
      domainStats[domain].sessions += 1;
    });

    const skillProgress = Object.entries(domainStats).map(([domain, stats]) => ({
      skill: domain,
      level: Math.round((stats.totalRating / stats.sessionCount) * 10), // Convert to percentage
      questions: stats.sessions,
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
    }
    
    const recentActivity: ActivityItem[] = [];

    // Add practice sessions to activity
    practiceSessions.forEach(session => {
      recentActivity.push({
        id: session._id.toString(),
        type: 'Practice',
        domain: session.domain,
        difficulty: session.difficulty,
        completedQuestions: session.completedQuestions,
        totalQuestions: session.totalQuestions,
        date: session.createdAt,
        timestamp: session.createdAt
      });
    });

    // Add mock sessions to activity
    mockSessions.forEach(session => {
      recentActivity.push({
        id: session._id.toString(),
        type: 'Mock Interview',
        domain: session.domain,
        difficulty: session.difficulty,
        overallRating: session.overallRating,
        pointsEarned: Math.round((session.overallRating || 0) * 10),
        date: session.createdAt,
        timestamp: session.createdAt
      });
    });

    // Sort by date and take last 4
    const sortedActivity = recentActivity
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 4);

    // 12. Prepare response data
    const dashboardData = {
      user: {
        id: user._id,
        email: user.email,
        username: user.username || user.firstName
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