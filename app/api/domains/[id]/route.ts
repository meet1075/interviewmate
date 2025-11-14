import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectDb from "@/dbconfig/db";
import Domain from "@/models/domain.model";
import Question from "@/models/question.model";
import PracticeSession from "@/models/practicesession.model";
import { MockSession } from "@/models/practicesession.model";

// --- UPDATE A DOMAIN (NAME OR STATUS) ---
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        // Await params before using its properties
        const { id } = await params;
        
        // 1. Authenticate and authorize the user as an admin
        const { sessionClaims } = await auth();
        if (sessionClaims?.metadata?.role !== 'admin') {
            return new NextResponse("Unauthorized", { status: 403 });
        }

        const values = await request.json(); // e.g., { name: "New Name" } or { status: "inactive" }

        await connectDb();

        // Fetch existing domain to detect name changes
        const existingDomain = await Domain.findById(id);
        if (!existingDomain) {
            return new NextResponse("Domain not found", { status: 404 });
        }

        const oldName = existingDomain.name;

        // 2. Find the domain by its ID and update it with the new values
        const updatedDomain = await Domain.findByIdAndUpdate(id, values, { new: true });
        if (!updatedDomain) {
            return new NextResponse("Domain not found after update", { status: 404 });
        }

        // If the domain name changed, update related collections and recalculate question counts
        if (values.name && typeof values.name === 'string' && values.name !== oldName) {
            try {
                // Update Questions that referenced the old domain name
                await Question.updateMany({ domain: oldName }, { $set: { domain: values.name } });

                // Update PracticeSession documents
                await PracticeSession.updateMany({ domain: oldName }, { $set: { domain: values.name } });

                // Update MockSession documents
                await MockSession.updateMany({ domain: oldName }, { $set: { domain: values.name } });

                // Recalculate questionsCount for this domain and persist
                const practiceQuestionsCount = await Question.countDocuments({ domain: values.name });
                const mockInterviewQuestions = await MockSession.aggregate([
                    { $match: { domain: values.name } },
                    { $unwind: '$questions' },
                    { $group: { _id: '$questions.id' } }
                ]);
                const mockQuestionsCount = mockInterviewQuestions.length;
                const totalQuestionsCount = practiceQuestionsCount + mockQuestionsCount;

                await Domain.findByIdAndUpdate(id, { questionsCount: totalQuestionsCount });
            } catch (relErr) {
                console.error('[DOMAIN_RENAME_RELATED_UPDATE_ERROR]', relErr);
            }
        }

        // Return the (possibly updated) domain document
        const finalDomain = await Domain.findById(id);
        return NextResponse.json(finalDomain);
        
    } catch (error) {
        console.error("[DOMAIN_PATCH_ERROR]", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}


// --- DELETE A DOMAIN ---
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        // Await params before using its properties
        const { id } = await params;
        
        // 1. Authenticate and authorize the user as an admin
        const { sessionClaims } = await auth();
        if (sessionClaims?.metadata?.role !== 'admin') {
            return new NextResponse("Unauthorized", { status: 403 });
        }
        
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

