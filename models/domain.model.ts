import { Schema, model, models, Document } from "mongoose";

/**
 * Interface representing a Domain document in MongoDB.
 */
export interface IDomain extends Document {
    name: string;
    questionsCount: number;
    activeUsers: number;
    status: 'active' | 'inactive';
    createdAt: Date;
    updatedAt: Date;
}

const DomainSchema = new Schema({
    name: {
        type: String,
        required: [true, "Domain name is required."],
        unique: true,
        trim: true,
    },
   
    questionsCount: {
        type: Number,
        default: 0,
    },
    activeUsers: {
        type: Number,
        default: 0,
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active',
    },
}, { 
    // This option adds `createdAt` and `updatedAt` fields to the document
    timestamps: true 
});

const Domain = models.Domain || model<IDomain>("Domain", DomainSchema);

export default Domain;

