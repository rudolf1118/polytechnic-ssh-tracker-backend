import { Schema, model } from 'mongoose';

const Student = new Schema({
    username: { type: String, required: true },
    firstNameAM: { type: String, required: true },
    lastNameAM: { type: String, required: true },
    firstNameEN: { type: String, required: true },
    lastNameEN: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    modifyAt: { type: Date, default: Date.now },
    activities: {
        type: String,
        ref: 'Activity',
        default: "",
    },
    password: { type: String, default: "" },
    group: { type: String, enum: ['lab-1', 'lab-2', 'lab-3', 'lab-4', ""], required: false, default: ""},
    role: { type: String, enum: ['admin', 'user'], default: 'user' },
    sessionId: { type: String, ref: 'Session', default: "" },
});

export default model('Student', Student);