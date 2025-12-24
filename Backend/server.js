const express = require("express");
const cors = require("cors");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const xss = require("xss-clean");
const path = require("path");
const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");

dotenv.config();

const userRoutes = require("./routes/userRoutes");
const postRoutes = require("./routes/postRoutes");
const followRoutes = require("./routes/followRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const blogScraper = require("./routes/blogScraper");
const db = require("./config/db");

const app = express();
app.set("trust proxy", 1);

// 🔥 CREATE HTTP SERVER ONCE
const server = http.createServer(app);

// ---------------- MIDDLEWARE ----------------
const corsOptions = {
  origin: [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://blogsphered.onrender.com",
    "https://tejasblogsbackend-com.onrender.com",
  ],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(xss());
app.use(cookieParser());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "default_secret_key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

// ---------------- DB ----------------
db();

// ---------------- ROUTES ----------------
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/follows", followRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/blogs", blogScraper);

app.get("/", (req, res) => {
  res.json("API is running...");
});

// ---------------- SOCKET.IO ----------------
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "https://blogsphered.onrender.com",
    ],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("join", (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined their room`);
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

// make io accessible in routes
app.set("io", io);

// ---------------- START SERVER (ONLY ONCE) ----------------
const PORT = process.env.PORT || 8082;

server.listen(PORT, () => {
  console.log(`🚀 Server + Socket.IO running on port ${PORT}`);
});
