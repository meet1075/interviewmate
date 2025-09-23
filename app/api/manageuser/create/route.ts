import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectDb from "@/dbconfig/db";
import User from "@/models/user.model";

// --- CREATE A NEW USER (Admin only) ---
export async function POST(request: Request) {
    try {
        // 1. Authenticate and authorize the user as an admin
        const { sessionClaims } = await auth();
        if (sessionClaims?.metadata?.role !== 'admin') {
            return new NextResponse("Unauthorized", { status: 403 });
        }
        
        // 2. Get the user data from the request
        const userData = await request.json();
        
        // 3. Validate required fields
        const { clerkId, email, userName, firstName, lastName, profileImage } = userData;
        if (!clerkId || !email || !userName || !firstName || !lastName) {
            return new NextResponse("Missing required fields", { status: 400 });
        }
        
        // 4. Connect to the database
        await connectDb();
        
        // 5. Create and save the new user
        const newUser = new User({
            clerkId,
            email,
            userName,
            firstName,
            lastName,
            profileImage: profileImage ,
            role: userData.role || 'user',
            status: userData.status || 'active'
        });
        
        await newUser.save();

        return NextResponse.json({
            id: newUser._id,
            clerkId: newUser.clerkId,
            name: `${newUser.firstName} ${newUser.lastName}`,
            email: newUser.email,
            userName: newUser.userName,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            profileImage: newUser.profileImage,
            role: newUser.role,
            status: newUser.status,
            joinDate: newUser.createdAt,
            lastActive: newUser.updatedAt,
            sessionsCompleted: 0,
            averageScore: 0,
            totalPoints: 0,
            badges: newUser.role === 'admin' ? ['Admin'] : ['User'],
            bookmarkedQuestions: newUser.bookmarkedQuestions || []
        }, { status: 201 });

    } catch (error) {
        console.error("[USER_POST_ERROR]", error);
        // Handle the case where a user with the same clerkId, email, or userName already exists
        if ((error as any).code === 11000) {
            return new NextResponse("A user with this information already exists.", { status: 409 });
        }
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}