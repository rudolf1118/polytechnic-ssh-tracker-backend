const { Schema, model } =  require('mongoose');

const Student = new Schema({
    username: { type: String, required: true },
    firstNameAM: { type: String, required: true },
    lastNameAM: { type: String, required: true },
    firstNameEN: { type: String, required: true },
    lastNameEN: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    modifyAt: { type: Date, default: Date.now },
    activities: [{
    type: [{
        type: Schema.Types.ObjectId,
        ref: 'Activity',
    }],
    default:[],
    required: true,
    }],

});

module.exports = model('Student', Student);