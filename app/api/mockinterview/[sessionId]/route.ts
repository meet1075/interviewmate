import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { OpenAI } from "openai";
import connectDb from "@/dbconfig/db";
import User from "@/models/user.model";
import { MockSession } from "@/models/practicesession.model";
import sessionStorage from "@/utils/sessionStorage";

// Initialize the AI client
const client = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

export async function POST(request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  try {
    // Await params before using its properties
    const { sessionId } = await params;
    console.log("Submit answer API called for session:", sessionId);
    
    // Input validation
    if (!sessionId || sessionId.trim() === '') {
      console.log("Invalid sessionId:", sessionId);
      return new NextResponse("Invalid session ID", { status: 400 });
    }
    
    // 1. Authenticate the user
    console.log("Checking authentication...");
    const { userId } = await auth();
    if (!userId) {
      console.log("Authentication failed - no userId");
      return new NextResponse("Unauthorized", { status: 401 });
    }
    console.log("User authenticated:", userId);

    // 2. Connect to the database
    console.log("Connecting to database...");
    await connectDb();
    console.log("Database connected");
    
    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      console.log("User not found in database for clerkId:", userId);
      return new NextResponse("User not found", { status: 404 });
    }
    console.log("User found in database:", user.email);

    // 3. Get answer data from request body
    console.log("Parsing request body...");
    let requestBody;
    try {
      requestBody = await request.json();
    } catch (parseError) {
      console.error("Failed to parse request body:", parseError);
      return new NextResponse("Invalid JSON in request body", { status: 400 });
    }
    
    const { questionId, answer, timeSpent } = requestBody;
    console.log("Request body parsed:", { questionId, answerLength: answer?.length, timeSpent });
    
    if (!questionId || !answer || timeSpent === undefined) {
      console.log("Missing required fields:", { questionId: !!questionId, answer: !!answer, timeSpent });
      return new NextResponse("Missing required fields: questionId, answer, timeSpent", { status: 400 });
    }

    console.log("All validations passed. Processing answer for question:", questionId);

    // 4. Get the session from database first, then try memory as fallback
    console.log("=== SUBMIT ANSWER DEBUG ===");
    console.log("Looking for session:", sessionId);
    console.log("User ID:", userId);
    console.log("User DB ID:", user._id);
    
    let session;
    
    // First, try to get from database using sessionId
    try {
      console.log("Searching database for sessionId:", sessionId);
      const dbSession = await MockSession.findOne({ sessionId: sessionId });
      console.log("Database query result:", dbSession ? "FOUND" : "NOT FOUND");
      
      if (dbSession) {
        console.log("Session found in database - Details:");
        console.log("- DB ID:", dbSession._id);
        console.log("- Session ID:", dbSession.sessionId);
        console.log("- User ID:", dbSession.userId);
        console.log("- Domain:", dbSession.domain);
        console.log("- Questions count:", dbSession.questions?.length || 0);
        console.log("- Answers count:", dbSession.answers?.length || 0);
        
        session = {
          questions: dbSession.questions,
          answers: dbSession.answers || [],
          domain: dbSession.domain,
          difficulty: dbSession.difficulty,
          userId: dbSession.userId
        };
        
        // Also store in memory for future requests
        sessionStorage.set(sessionId, session);
        console.log("Session cached in memory");
      } else {
        console.log("No session found in database with sessionId:", sessionId);
        
        // Let's also check if there are any sessions for this user
        const userSessions = await MockSession.find({ userId: user._id }).sort({ createdAt: -1 }).limit(5);
        console.log("Recent sessions for this user:", userSessions.map(s => ({
          sessionId: s.sessionId,
          createdAt: s.createdAt
        })));
      }
    } catch (dbError) {
      console.error("Database lookup failed:", dbError);
    }
    
    // Fallback to memory storage
    if (!session) {
      console.log("Trying memory storage as fallback");
      session = sessionStorage.get(sessionId);
      console.log("Memory storage result:", session ? "FOUND" : "NOT FOUND");
    }
    
    if (!session) {
      console.error("=== SESSION NOT FOUND ===");
      console.error("SessionId searched:", sessionId);
      console.error("User:", user.email);
      console.error("No session found in database or memory");
      return new NextResponse("Session not found", { status: 404 });
    }
    
    console.log("Session found! Questions count:", session.questions?.length);

    // 5. Find the question
    const question = session.questions.find((q: any) => q.id === questionId);
    if (!question) {
      return new NextResponse("Question not found", { status: 404 });
    }

    // 6. Use AI to judge the answer and provide feedback
    let evaluation = { rating: 5, feedback: "Answer submitted successfully" };
    
    try {
      // Check if AI API key is available
      if (!process.env.GEMINI_API_KEY) {
        console.log("GEMINI_API_KEY not found, using default evaluation");
        evaluation = {
          rating: Math.floor(Math.random() * 4) + 6, // Random rating between 6-9
          feedback: "Answer submitted. AI evaluation temporarily unavailable."
        };
      } else {
        const systemPrompt = `
            You are an expert interviewer evaluating candidate answers.  
            You will be given:
            - The question
            - The AI reference answer
            - The user's answer

            ### Task:
            - Compare the user's answer with the reference answer carefully.
            - Be strict and unbiased in your evaluation.
            - Give a rating from 1-10 based purely on the accuracy, completeness, and relevance of the answer.
            - Provide honest, detailed feedback (2-3 sentences) pointing out strengths and weaknesses.
            - Do NOT inflate ratings or give generic feedback.

            Return output strictly in JSON format:
            {
              "rating": number,
              "feedback": "string"
            }
        `;

        const userPrompt = JSON.stringify({ 
          question: question.title + " - " + question.description, 
          referenceAnswer: question.referenceAnswer, 
          userAnswer: answer 
        });

        console.log("Making AI API call...");
        const response = await client.chat.completions.create({
          model: "gemini-2.0-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          response_format: { type: "json_object" },
          temperature: 0.9,
          max_tokens: 500 // Add token limit to prevent excessive responses
        });

        console.log("AI API response received");
        
        if (response.choices[0]?.message?.content) {
          try {
            evaluation = JSON.parse(response.choices[0].message.content);
            
            // Validate the response structure
            if (typeof evaluation.rating !== 'number' || typeof evaluation.feedback !== 'string') {
              throw new Error('Invalid AI response structure');
            }
            
            // Ensure rating is within bounds
            evaluation.rating = Math.max(1, Math.min(10, evaluation.rating));
            
          } catch (parseError) {
            console.error("Failed to parse AI response:", parseError);
            console.log("AI raw response:", response.choices[0].message.content);
            
            // Fallback evaluation
            evaluation = {
              rating: 6,
              feedback: "Answer submitted successfully. AI evaluation temporarily unavailable due to parsing error."
            };
          }
        } else {
          console.log("Empty AI response, using fallback");
          evaluation = {
            rating: 6,
            feedback: "Answer submitted successfully. AI evaluation temporarily unavailable."
          };
        }
      }
    } catch (aiError) {
      console.error("AI evaluation failed:", aiError);
      
      // Use fallback evaluation
      evaluation = {
        rating: Math.floor(Math.random() * 4) + 5, // Random rating between 5-8
        feedback: "Answer submitted successfully. AI evaluation temporarily unavailable due to API error."
      };
    }

    // 7. Store the answer in the session
    if (!session.answers) {
      session.answers = [];
    }

    const answerData = {
      questionId: questionId,
      answer: answer,
      rating: evaluation.rating || 5,
      feedback: evaluation.feedback || "Answer submitted successfully",
      timeSpent: timeSpent
    };

    console.log("Storing answer data:", { questionId, rating: answerData.rating, timeSpent });

    // Add to session answers
    session.answers.push(answerData);
    
    // Save to memory first (always works)
    try {
      sessionStorage.set(sessionId, session);
      console.log("Answer saved to memory storage");
    } catch (memoryError) {
      console.error("Failed to save to memory:", memoryError);
    }
    
    // Update database as well (with better error handling)
    try {
      const updateResult = await MockSession.findOneAndUpdate(
        { sessionId: sessionId },
        { $push: { answers: answerData } },
        { new: true, upsert: false }
      );
      
      if (updateResult) {
        console.log("Answer saved to database successfully");
      } else {
        console.log("Database update returned null - session might not exist in DB");
      }
    } catch (dbError) {
      console.error("Failed to save answer to database:", dbError);
      if (dbError instanceof Error) {
        console.error("Database error details:", {
          name: dbError.name,
          message: dbError.message
        });
      }
      // Continue anyway since we have it in memory
    }

    console.log("Answer processing completed successfully");

    return NextResponse.json({
      rating: evaluation.rating,
      feedback: evaluation.feedback,
      message: "Answer submitted successfully"
    });

  } catch (error) {
    console.error("[SUBMIT_ANSWER_ERROR]", error);
    
    // Log more detailed error information
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    
    // Return more specific error messages based on error type
    if (error instanceof Error) {
      if (error.message.includes('Session not found')) {
        return new NextResponse("Session not found", { status: 404 });
      }
      if (error.message.includes('Question not found')) {
        return new NextResponse("Question not found", { status: 404 });
      }
      if (error.message.includes('Missing required fields')) {
        return new NextResponse("Missing required fields", { status: 400 });
      }
    }
    
    return new NextResponse("Internal Server Error - Answer submission failed", { status: 500 });
  }
}