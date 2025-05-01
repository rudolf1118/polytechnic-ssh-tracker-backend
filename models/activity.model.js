import { Schema, model } from 'mongoose';
const Activity = new Schema({
    username: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    studentId: { type: Schema.Types.ObjectId, required: true },
    createdAt: { type: Date, default: Date.now },
    lastUpdatedAt: { type: Date, default: Date.now },
    durationOfActivity: { type: String, default: 0 },
    lastOnline: { type: Date },
    activities: [{ 
        ip: { type: String, required: true },
        hostname: { type: String, required: true },
        date: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
        modifyAt: { type: Date, default: Date.now },
        duration: { type: String, default: 0 },
        description: { type: String, default: '' },
    }],
});

export default model('Activity', Activity);