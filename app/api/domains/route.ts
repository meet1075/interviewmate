import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectDb from "@/dbconfig/db";
import Domain from "@/models/domain.model";
import Question from "@/models/question.model";
import PracticeSession, { MockSession } from "@/models/practicesession.model";

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

        // 4. Calculate real question counts for each domain
        const domainsWithCounts = await Promise.all(domains.map(async (domain) => {
            // Count questions from Question model for this domain
            const practiceQuestionsCount = await Question.countDocuments({ domain: domain.name });
            
            // Count unique questions used in mock interviews for this domain
            const mockInterviewQuestions = await MockSession.aggregate([
                { $match: { domain: domain.name } },
                { $unwind: '$questions' },
                { $group: { _id: '$questions.id' } }
            ]);
            
            const mockQuestionsCount = mockInterviewQuestions.length;
            
            // Total questions = practice questions + unique mock interview questions
            const totalQuestionsCount = practiceQuestionsCount + mockQuestionsCount;
            
            return {
                _id: domain._id,
                name: domain.name,
                questionsCount: totalQuestionsCount,
                status: domain.status,
                createdAt: domain.createdAt,
                updatedAt: domain.updatedAt
            };
        }));

        return NextResponse.json(domainsWithCounts);

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

