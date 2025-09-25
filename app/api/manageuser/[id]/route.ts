import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectDb from "@/dbconfig/db";
import User from "@/models/user.model";

// --- UPDATE A USER'S STATUS OR ROLE ---
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        // Await params before using its properties
        const { id } = await params;
        
        const { sessionClaims } = await auth();
        if (sessionClaims?.metadata?.role !== 'admin') {
            return new NextResponse("Unauthorized", { status: 403 });
        }

        const values = await request.json();

        // Validate the update values (only allow active and suspended)
        if (values.status && !['active', 'suspended'].includes(values.status)) {
            return new NextResponse("Invalid status provided. Only 'active' and 'suspended' are allowed.", { status: 400 });
        }
        if (values.role && !['admin', 'user'].includes(values.role)) {
            return new NextResponse("Invalid role provided", { status: 400 });
        }

        await connectDb();

        const updatedUser = await User.findByIdAndUpdate(id, values, { new: true });
        if (!updatedUser) {
            return new NextResponse("User not found", { status: 404 });
        }

        return NextResponse.json(updatedUser);
        
    } catch (error) {
        console.error("[USER_PATCH_ERROR]", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

