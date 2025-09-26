import { NextResponse } from "next/server";
import connectDb from "@/dbconfig/db";
import Domain from "@/models/domain.model";

// --- GET ALL DOMAINS FOR USERS (PUBLIC) ---
export async function GET() {
    try {
        // 1. Connect to the database
        await connectDb();

        // 2. Fetch only active domains for practice selection
        const domains = await Domain.find({ status: 'active' }).sort({ name: 1 }).select('name');

        // 3. Return just the domain names
        const domainNames = domains.map(domain => domain.name);

        return NextResponse.json({ domains: domainNames });

    } catch (error) {
        console.error("[PUBLIC_DOMAINS_GET_ERROR]", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}