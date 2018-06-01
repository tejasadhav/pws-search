const mongoose = require('mongoose');
let user = require('../models/user');

const querySchema = mongoose.Schema({
    query: String,
    count: { type: Number, default: 1},
    updated: { type: Date, default: Date.now },
    user: {type: mongoose.Schema.Types.ObjectId, ref: user}
});

const Query = module.exports = mongoose.model('Query',querySchema);
