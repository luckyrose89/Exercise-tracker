const mongoose = require('mongoose');
var Schema = mongoose.Schema;

const workoutSchema = new Schema({
    description: {
        type: String,
        required: true
    },
    duration: Number,
    date: {}
});

const PersonSchema = new Schema({
    username: {
        type: String,
        required: true
    },
    userId: String,
    exercise: [workoutSchema]
});

const User = mongoose.model('user', PersonSchema);

module.exports = User;