import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectDb from "@/dbconfig/db";
import Domain from "@/models/domain.model";

// --- GET ALL DOMAINS ---
export async function GET(request: Request) {
    try {
        // 1. Authenticate and authorize the user as an admin
        const { sessionClaims } = await auth();
        if (sessionClaims?.metadata?.role !== 'admin') {
            return new NextResponse("Unauthorized", { status: 403 });
        }

        // 2. Connect to the database
        await connectDb();

        // 3. Fetch all domains, sorted by the newest first
        const domains = await Domain.find({}).sort({ createdAt: -1 });

        return NextResponse.json(domains);

    } catch (error) {
        console.error("[DOMAINS_GET_ERROR]", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}


// --- CREATE A NEW DOMAIN ---
export async function POST(request: Request) {
    try {
        // 1. Authenticate and authorize the user as an admin
        const { sessionClaims } = await auth();
        if (sessionClaims?.metadata?.role !== 'admin') {
            return new NextResponse("Unauthorized", { status: 403 });
        }
        
        // 2. Get the domain name from the request
        const { name } = await request.json();
        if (!name) {
            return new NextResponse("Domain name is required", { status: 400 });
        }
        
        // 3. Connect to the database
        await connectDb();
        
        // 4. Create and save the new domain
        const newDomain = new Domain({ name });
        await newDomain.save();

        return NextResponse.json(newDomain, { status: 201 });

    } catch (error) {
        console.error("[DOMAINS_POST_ERROR]", error);
        // Handle the case where a domain with the same name already exists
        if ((error as any).code === 11000) {
            return new NextResponse("A domain with this name already exists.", { status: 409 });
        }
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

