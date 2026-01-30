const mongoose = require('mongoose');

const testResponseSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    sections: {
        riasec: {
            answers: [Object],
            completed: Boolean,
            submittedAt: Date
        },
        intelligence: {
            answers: [Object],
            completed: Boolean,
            submittedAt: Date
        },
        emotional: {
            answers: [Object],
            completed: Boolean,
            submittedAt: Date
        },
        personality: {
            answers: [Object],
            completed: Boolean,
            submittedAt: Date
        },
        behavioral: {
            answers: [Object],
            completed: Boolean,
            submittedAt: Date
        }
    },
    profile: { type: Object, default: {} },
    careerSuggestion: { type: Object },
    // Legacy support
    answers: [Object],
    submittedAt: Date
}, {
    timestamps: true
});

module.exports = mongoose.model('TestResponse', testResponseSchema);
