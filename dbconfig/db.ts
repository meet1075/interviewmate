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
    const MONGO_URL = process.env.MONGO_URL;

    if (!MONGO_URL) {
      throw new Error(
        "Please define the MONGO_URL environment variable inside .env.local"
      );
    }

    console.log("Creating new database connection.");
    cached.promise = mongoose.connect(MONGO_URL);
  }
  
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null; // Reset promise on error
    throw e;
  }

  return cached.conn;
}

export default connectDb;



// import mongoose from "mongoose"
// export async function connect() {
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