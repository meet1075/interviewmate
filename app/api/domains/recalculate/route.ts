import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectDb from "@/dbconfig/db";
import Domain from "@/models/domain.model";
import Question from "@/models/question.model";
import { MockSession } from "@/models/practicesession.model";

// Recalculate questionsCount for all domains and persist to Domain collection
export async function POST() {
  try {
    const { sessionClaims } = await auth();
    if (sessionClaims?.metadata?.role !== 'admin') {
      return new NextResponse('Unauthorized', { status: 403 });
    }

    await connectDb();

    const domains = await Domain.find({});

    for (const domain of domains) {
      const practiceQuestionsCount = await Question.countDocuments({ domain: domain.name });

      const mockInterviewQuestions = await MockSession.aggregate([
        { $match: { domain: domain.name } },
        { $unwind: '$questions' },
        { $group: { _id: '$questions.id' } }
      ]);

      const mockQuestionsCount = mockInterviewQuestions.length;
      const totalQuestionsCount = practiceQuestionsCount + mockQuestionsCount;

      await Domain.findByIdAndUpdate(domain._id, { questionsCount: totalQuestionsCount });
    }

    return NextResponse.json({ message: 'Recalculation complete' });
  } catch (error) {
    console.error('[RECALCULATE_DOMAINS_ERROR]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
