import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectDb from "@/dbconfig/db";
import User from "@/models/user.model";
import PracticeSession, { MockSession } from "@/models/practicesession.model";
import Question from "@/models/question.model";

export async function GET() {
  try {
    // 1. Authenticate and authorize the user as an admin
    const { sessionClaims } = await auth();
    if (sessionClaims?.metadata?.role !== 'admin') {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    // 2. Connect to the database
    await connectDb();

    // 3. Get current date boundaries for "today" stats
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);

    // 4. Get user statistics
    const totalUsers = await User.countDocuments({ role: { $ne: 'admin' } }); // Exclude admins
    const usersRegisteredToday = await User.countDocuments({
      role: { $ne: 'admin' },
      createdAt: { $gte: startOfToday, $lt: endOfToday }
    });

    // 5. Get question statistics
    const totalQuestionsGenerated = await Question.countDocuments();
    const questionsGeneratedToday = await Question.countDocuments({
      createdAt: { $gte: startOfToday, $lt: endOfToday }
    });

    // 6. Get mock interview statistics
    const totalMockInterviews = await MockSession.countDocuments({
      completedAt: { $exists: true, $ne: null }
    });
    const mockInterviewsCompletedToday = await MockSession.countDocuments({
      completedAt: { $gte: startOfToday, $lt: endOfToday }
    });

    // 7. Get domain-wise statistics for mock interviews
    const mockInterviewStats = await MockSession.aggregate([
      {
        $match: { completedAt: { $exists: true, $ne: null } }
      },
      {
        $group: {
          _id: '$domain',
          mockInterviews: { $sum: 1 },
          mockUsers: { $addToSet: '$userId' }
        }
      }
    ]);

    // 8. Get domain-wise statistics for practice sessions
    const practiceStats = await PracticeSession.aggregate([
      {
        $group: {
          _id: '$domain',
          practiceSessions: { $sum: 1 },
          practiceUsers: { $addToSet: '$user' }
        }
      }
    ]);

    // 9. Combine mock interview and practice session stats by domain
    const domainStatsMap = new Map();
    
    // Add mock interview stats
    mockInterviewStats.forEach(stat => {
      domainStatsMap.set(stat._id, {
        domain: stat._id,
        mockInterviews: stat.mockInterviews,
        practiceSessions: 0,
        mockUsers: stat.mockUsers,
        practiceUsers: [],
        totalUsers: stat.mockUsers
      });
    });

    // Add practice session stats
    practiceStats.forEach(stat => {
      const existing = domainStatsMap.get(stat._id);
      if (existing) {
        existing.practiceSessions = stat.practiceSessions;
        existing.practiceUsers = stat.practiceUsers;
        // Combine users from both mock and practice (remove duplicates)
        const allUsers = [...existing.mockUsers, ...stat.practiceUsers];
        existing.totalUsers = [...new Set(allUsers.map(u => u.toString()))];
        existing.uniqueUsersCount = existing.totalUsers.length;
      } else {
        domainStatsMap.set(stat._id, {
          domain: stat._id,
          mockInterviews: 0,
          practiceSessions: stat.practiceSessions,
          mockUsers: [],
          practiceUsers: stat.practiceUsers,
          totalUsers: stat.practiceUsers,
          uniqueUsersCount: stat.practiceUsers.length
        });
      }
    });

    // Convert map to array and add unique user counts
    const domainStats = Array.from(domainStatsMap.values()).map(stat => ({
      domain: stat.domain,
      mockInterviews: stat.mockInterviews,
      practiceSessions: stat.practiceSessions,
      uniqueUsersCount: stat.uniqueUsersCount || stat.totalUsers.length
    })).sort((a, b) => (b.mockInterviews + b.practiceSessions) - (a.mockInterviews + a.practiceSessions));

    // 10. Get recent activity (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentActivity = await MockSession.aggregate([
      {
        $match: {
          completedAt: { $gte: sevenDaysAgo, $lt: endOfToday }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$completedAt" }
          },
          sessionsCompleted: { $sum: 1 },
          averageRating: { $avg: '$overallRating' }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // 11. Get top performing users
    const topUsers = await MockSession.aggregate([
      {
        $match: { completedAt: { $exists: true, $ne: null } }
      },
      {
        $group: {
          _id: '$userId',
          totalSessions: { $sum: 1 },
          averageRating: { $avg: '$overallRating' },
          totalPoints: { $sum: '$overallRating' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      {
        $unwind: '$userInfo'
      },
      {
        $project: {
          userId: '$_id',
          name: { $concat: ['$userInfo.firstName', ' ', '$userInfo.lastName'] },
          email: '$userInfo.email',
          totalSessions: 1,
          averageRating: { $round: ['$averageRating', 2] },
          totalPoints: { $round: ['$totalPoints', 2] }
        }
      },
      {
        $sort: { averageRating: -1, totalSessions: -1 }
      },
      {
        $limit: 10
      }
    ]);

    // 12. Format response
    const response = {
      stats: {
        totalUsers,
        usersRegisteredToday,
        totalQuestionsGenerated,
        questionsGeneratedToday,
        totalMockInterviews,
        mockInterviewsCompletedToday
      },
      domainStats,
      recentActivity,
      topUsers,
      todaysSummary: {
        newRegistrations: usersRegisteredToday,
        questionsGenerated: questionsGeneratedToday,
        mockInterviewsCompleted: mockInterviewsCompletedToday,
        totalActiveUsers: totalUsers // For now, showing total users as active
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error("[ADMIN_DASHBOARD_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}