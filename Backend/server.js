const express = require("express");
const cors = require("cors");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const userRoutes = require("./routes/userRoutes");
const postRoutes =require("./routes/postRoutes");
const app = express();

// Middleware
app.use(cors({ credentials: true, origin: "http://localhost:5173" }));
app.use(express.json());
app.use(cookieParser());
app.use(session({
    secret: "your_secret_key", // Change to a secure key
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

// Routes
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);

app.get("/", (req, res) => {
    return res.json("API is running...");
});

const PORT = 8082;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
