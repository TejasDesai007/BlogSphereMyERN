const express = require("express");
const cors = require("cors");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const xss = require("xss-clean");
const path = require("path");

const userRoutes = require("./routes/userRoutes");
const postRoutes = require("./routes/postRoutes");
const followRoutes = require("./routes/followRoutes");
const app = express();

const db = require("./config/db");


// Middleware
app.use(cors({
  credentials: true,
  origin: [
    "http://localhost:5173", 
    "https://blogsphered.onrender.com"
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(xss());
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(session({
    secret: "your_secret_key", // Change to a secure key
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

db();
// Routes
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/follows", followRoutes);

app.get("/", (req, res) => {
    return res.json("API is running...");
});

const PORT = 8082;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});