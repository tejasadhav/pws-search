const mongoose = require('mongoose');
let user = require('../models/user');

const weblogSchema = mongoose.Schema({
    query: String,
    title: String,
    url: String,
    snippet: String,
    count: { type: Number, default: 1},
    updated: { type: Date, default: Date.now },
    user: {type: mongoose.Schema.Types.ObjectId, ref: user}
});

const WebLog = module.exports = mongoose.model('WebLog',weblogSchema);
