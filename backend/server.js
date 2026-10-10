const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const uploadDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((error) => console.log("MongoDB Error:", error.message));

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: "" },
  completed: { type: Boolean, default: false },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  }
}, { timestamps: true });

const User = mongoose.model("User", userSchema);
const Task = mongoose.model("Task", taskSchema);

function authenticateToken(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token required" });
  }

  try {
    req.user = jwt.verify(
      header.split(" ")[1],
      process.env.JWT_SECRET
    );
    next();
  } catch {
    res.status(403).json({ message: "Invalid or expired token" });
  }
}

app.get("/", (req, res) => {
  res.json({ message: "Skill Nexus Week 3 API is running!" });
});

// Register
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (await User.findOne({ email: normalizedEmail })) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const user = await User.create({
      name,
      email: normalizedEmail,
      password: await bcrypt.hash(password, 10)
    });

    res.status(201).json({
      message: "Registration successful",
      userId: user._id
    });
  } catch (error) {
    res.status(500).json({ message: "Registration failed" });
  }
});

// Login
app.post("/api/auth/login", async (req, res) => {
  try {
    const email = (req.body.email || "").toLowerCase().trim();
    const { password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password || "", user.password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { userId: user._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.json({
      message: "Login successful",
      token,
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch {
    res.status(500).json({ message: "Login failed" });
  }
});

// Get tasks
app.get("/api/tasks", authenticateToken, async (req, res) => {
  const tasks = await Task.find({ userId: req.user.userId }).sort({ createdAt: -1 });
  res.json(tasks);
});

// Create task
app.post("/api/tasks", authenticateToken, async (req, res) => {
  const { title, description } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ message: "Task title is required" });
  }

  const task = await Task.create({
    title: title.trim(),
    description: description || "",
    userId: req.user.userId
  });

  res.status(201).json(task);
});

// Update task
app.put("/api/tasks/:id", authenticateToken, async (req, res) => {
  const updates = {};

  if (typeof req.body.title === "string") updates.title = req.body.title.trim();
  if (typeof req.body.description === "string") updates.description = req.body.description;
  if (typeof req.body.completed === "boolean") updates.completed = req.body.completed;

  const task = await Task.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.userId },
    updates,
    { new: true, runValidators: true }
  );

  if (!task) return res.status(404).json({ message: "Task not found" });
  res.json(task);
});

// Delete task
app.delete("/api/tasks/:id", authenticateToken, async (req, res) => {
  const task = await Task.findOneAndDelete({
    _id: req.params.id,
    userId: req.user.userId
  });

  if (!task) return res.status(404).json({ message: "Task not found" });
  res.json({ message: "Task deleted successfully" });
});

// Image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) return cb(null, true);
    cb(new Error("Only image files are allowed"));
  }
});

app.post("/api/upload", authenticateToken, upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ message: "Choose an image" });

  res.status(201).json({
    message: "Image uploaded successfully",
    imageUrl: `/uploads/${req.file.filename}`
  });
});

app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError || error.message === "Only image files are allowed") {
    return res.status(400).json({ message: error.message });
  }
  res.status(500).json({ message: "Something went wrong" });
});

const PORT = process.env.PORT || 5003;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});