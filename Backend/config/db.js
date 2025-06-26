const mongoose = require("mongoose");

const db = async () => {
    try {
        await mongoose.connect("mongodb+srv://tejasdesai056:cgUWOqlFxqZWpBiw@blog.d6d3dfu.mongodb.net/Blog?retryWrites=true&w=majority&appName=Blog");
        console.log("MongoDB connected successfully");
    } catch (err) {
        console.error("MongoDB connection failed:", err.message);
        process.exit(1);
    }
};

module.exports = db;
