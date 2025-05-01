import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true,
    },
    username: {
        type: String,
        required: true,
    },
    sessionTime:{
        type: [Date],
        required: true,
    },
    count:{
        type: Number,
        required: true,
        default: 0,
    },
    lastOnline: {
        type: Date,
        default: "1999-01-01T00:00:00.000Z",
        required: true,
    }

}, { timestamps: true });

export default mongoose.model('Session', sessionSchema);