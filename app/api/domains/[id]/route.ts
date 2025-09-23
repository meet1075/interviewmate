import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectDb from "@/dbconfig/db";
import Domain from "@/models/domain.model";

// Define the shape of the route parameters
interface Params {
    params: { id: string };
}

// --- UPDATE A DOMAIN (NAME OR STATUS) ---
export async function PATCH(request: Request, { params }: Params) {
    try {
        // 1. Authenticate and authorize the user as an admin
        const { sessionClaims } =await auth();
        if (sessionClaims?.metadata?.role !== 'admin') {
            return new NextResponse("Unauthorized", { status: 403 });
        }

        const { id } = params;
        const values = await request.json(); // e.g., { name: "New Name" } or { status: "inactive" }

        await connectDb();

        // 2. Find the domain by its ID and update it with the new values
        const updatedDomain = await Domain.findByIdAndUpdate(id, values, { new: true });
        if (!updatedDomain) {
            return new NextResponse("Domain not found", { status: 404 });
        }

        return NextResponse.json(updatedDomain);
        
    } catch (error) {
        console.error("[DOMAIN_PATCH_ERROR]", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}


// --- DELETE A DOMAIN ---
export async function DELETE(request: Request, { params }: Params) {
    try {
        // 1. Authenticate and authorize the user as an admin
        const { sessionClaims } = await auth();
        if (sessionClaims?.metadata?.role !== 'admin') {
            return new NextResponse("Unauthorized", { status: 403 });
        }

        const { id } = params;
        
        await connectDb();
        
        // 2. Find and delete the domain by its ID
        const deletedDomain = await Domain.findByIdAndDelete(id);
        if (!deletedDomain) {
            return new NextResponse("Domain not found", { status: 404 });
        }
        
        // Note: You might also want to delete all questions associated with this domain
        // await Question.deleteMany({ domain: deletedDomain.name });

        return new NextResponse(null, { status: 204 }); // 204 No Content is standard for a successful deletion

    } catch (error) {
        console.error("[DOMAIN_DELETE_ERROR]", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

