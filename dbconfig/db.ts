import mongoose from "mongoose";

declare global {
  var mongoose: {
    promise: Promise<typeof import("mongoose")> | null;
    conn: typeof import("mongoose") | null;
  };
}

let cached = globalThis.mongoose;

if (!cached) {
  cached = globalThis.mongoose = { conn: null, promise: null };
}

async function connectDb() {
  if (cached.conn) {
    console.log("Using cached database connection.");
    return cached.conn;
  }

  if (!cached.promise) {
    const MONGODB_URL = process.env.MONGODB_URL;

    if (!MONGODB_URL) {
      throw new Error(
        "Please define the MONGODB_URL environment variable"
      );
    }

    console.log("Creating new database connection.");
    
    // MongoDB connection options optimized for Vercel serverless
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      retryWrites: true,
      retryReads: true,
    };

    cached.promise = mongoose.connect(MONGODB_URL, opts).then((mongoose) => {
      console.log("MongoDB connection established successfully");
      return mongoose;
    });
  }
  
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null; // Reset promise on error
    console.error("MongoDB connection error:", e);
    throw e;
  }

  return cached.conn;
}

export default connectDb;



// import mongoose from "mongoose"
// export async function connectDb() {
//     try {
//         mongoose.connect(process.env.MONGO_URL!)
//         const connection=mongoose.connection
//         connection.on('connected',()=>{
//             console.log('MongoDB connected')
//         })
//         connection.on('error',(err)=>{
//             console.log('Connection Error'+err);
//             process.exit()
//         })
//     } catch (error) {
//         console.log('Something went wrong');
//         console.log(error); 
//     }
// }