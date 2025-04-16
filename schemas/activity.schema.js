import { Schema, model } from 'mongoose';

const Activity = new Schema({
    username: { type: String, required: true },
    ip: {type: String, required: true},
    hostname: {type: String, required: true},
    date: {type: String, required: true},
    createdAt: { type: Date, default: Date.now },
    modifyAt: { type: Date, default: Date.now },
    rating: { type: Number, default: 0 },
    description: { type: String, default: '' },
    status: { type: String, default: 'active' },
    type: { type: String, default: 'default' },
});

module.export = model('Activity', Activity);