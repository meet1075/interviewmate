import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectDb from "@/dbconfig/db";
import User from "@/models/user.model";
import { MockSession } from "@/models/practicesession.model";

interface UserDocument {
    _id: { toString: () => string };
    clerkId: string;
    email: string;
    userName: string;
    firstName: string;
    lastName: string;
    profileImage: string;
    role: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    points: number;
    status: string;
    bookmarkedQuestions?: unknown[];
}

// --- GET ALL USERS WITH SEARCH AND FILTER OPTIONS ---
export async function GET(request: Request) {
    try {
        // 1. Authenticate and authorize the user as an admin
        const { sessionClaims } = await auth();
        if (sessionClaims?.metadata?.role !== 'admin') {
            return new NextResponse("Unauthorized", { status: 403 });
        }

        // 2. Extract query parameters
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        const status = searchParams.get('status') || 'all';
        const role = searchParams.get('role') || 'all';
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');

        // 3. Connect to the database
        await connectDb();

        // 4. Build the filter query
        const filterQuery: { $or?: Array<Record<string, unknown>>; role?: string; status?: string } = {};

        // Search filter (name, email, userName)
        if (search.trim()) {
            filterQuery.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { userName: { $regex: search, $options: 'i' } }
            ];
        }

        // Status filter
        if (status !== 'all') {
            filterQuery.status = status;
        }

        // Role filter
        if (role !== 'all') {
            filterQuery.role = role;
        }

        // 5. Calculate pagination
        const skip = (page - 1) * limit;

        // 6. Fetch users with filters, pagination, and sorting
        const users = (await User.find(filterQuery)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean()) as unknown as UserDocument[]; // Use lean() for better performance

        // 7. Get total count for pagination
        const totalUsers = await User.countDocuments(filterQuery);

        // 8. Calculate statistics (only active and suspended, no inactive)
        const totalCount = await User.countDocuments();
        const activeCount = await User.countDocuments({ status: 'active' });
        const suspendedCount = await User.countDocuments({ status: 'suspended' });

        // 9. Get mock interview session statistics for all users
        const userIds = users.map(user => user._id);
        const sessionStats = await MockSession.aggregate([
            {
                $match: { 
                    userId: { $in: userIds },
                    completedAt: { $exists: true, $ne: null } // Only completed sessions
                }
            },
            {
                $group: {
                    _id: '$userId',
                    totalSessions: { $sum: 1 },
                    totalRating: { $sum: '$overallRating' },
                    averageRating: { $avg: '$overallRating' }
                }
            }
        ]);

        // Create a map for quick lookup
        const statsMap = new Map();
        sessionStats.forEach(stat => {
            // Ensure ratings are within expected bounds (1-10 per session)
            const clampedAverageRating = Math.min(Math.max(stat.averageRating || 0, 0), 10);
            const clampedTotalRating = Math.min(stat.totalRating || 0, stat.totalSessions * 10);
            
            statsMap.set(stat._id.toString(), {
                sessionsCompleted: stat.totalSessions,
                totalRating: clampedTotalRating,
                averageRating: clampedAverageRating
            });
        });

        // 10. Format response with user data and metadata
        const response = {
            users: users.map((user: UserDocument) => {
                const userStats = statsMap.get(user._id.toString()) || {
                    sessionsCompleted: 0,
                    totalRating: 0,
                    averageRating: 0
                };

                // Calculate percentage based on average rating (1-10 scale)
                // Convert average rating to percentage (10 = 100%, 5 = 50%, etc.)
                const averagePercentage = userStats.sessionsCompleted > 0 
                    ? Math.round((userStats.averageRating / 10) * 100)
                    : 0;

                return {
                    id: user._id,
                    clerkId: user.clerkId,
                    name: `${user.firstName} ${user.lastName}`,
                    email: user.email,
                    userName: user.userName,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    profileImage: user.profileImage,
                    role: user.role,
                    status: user.status,
                    joinDate: user.createdAt,
                    lastActive: user.updatedAt,
                    // Real data from mock interview sessions
                    sessionsCompleted: userStats.sessionsCompleted,
                    averageScore: averagePercentage,
                    totalPoints: userStats.totalRating,
                    badges: user.role === 'admin' ? ['Admin'] : ['User'],
                    bookmarkedQuestions: user.bookmarkedQuestions || []
                };
            }),
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalUsers / limit),
                totalUsers: totalUsers,
                hasNextPage: page * limit < totalUsers,
                hasPrevPage: page > 1
            },
            stats: {
                total: totalCount,
                active: activeCount,
                suspended: suspendedCount
            }
        };

        return NextResponse.json(response);

    } catch (error) {
        console.error("[USERS_GET_ERROR]", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

