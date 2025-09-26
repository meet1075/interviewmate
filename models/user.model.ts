import {Schema,model,models} from "mongoose"

const userSchema = new Schema({
    clerkId:{type:String,
            required:true,
            unique:true},
    email:{type:String,
            required:true,
            unique:true},
    userName:{type:String,
            required:true,
            unique:true},
    profileImage:{type:String,
            required:true},
    firstName:{type:String,
            required:true},
    lastName:{type:String,
            required:true},
    role: {
           type: String,
           enum: ['admin', 'user'],
           default: 'user'
           },
    status: {
           type: String,
           enum: ['active', 'suspended', 'inactive'],
           default: 'active'
           },
    bookmarkedQuestions: [{
            type: Schema.Types.ObjectId,
            ref: 'Question'
  }],
    totalPoints: {
           type: Number,
           default: 0
  },
    practiceSessionsCompleted: {
           type: Number,
           default: 0
  },
    mockInterviewsCompleted: {
           type: Number,
           default: 0
  }
},{timestamps:true})

const User = models?.User || model("User",userSchema)

export default User