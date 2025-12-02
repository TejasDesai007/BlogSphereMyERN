const mongoose = require('mongoose');
const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Post = require("../models/Post");
const Follow = require("../models/Follow"); // Make sure this line exists
const router = express.Router();
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email:    { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
