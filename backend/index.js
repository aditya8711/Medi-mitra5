import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import { GoogleGenerativeAI } from "@google/generative-ai";
import mainRoutes from "./routes/main.js";
import protectedRoutes from "./routes/protected.js";
import Appointment from "./models/Appointment.js";
import authRoutes from "./routes/auth.js";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import initSocket from "./services/socket.js";
import Ragroutes from "./routes/ragRoutes.js";
import os from "os";   // ✅ Detect IPv4

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Support multiple comma-separated frontend origins (e.g. local + production)
const rawOrigins = process.env.FRONTEND_URL || "http://localhost:5173,http://localhost:3000";
const ALLOWED_ORIGINS = rawOrigins.split(",").map(o => o.trim()).filter(Boolean);
console.log("🌐 Allowed CORS origins:", ALLOWED_ORIGINS);

// ✅ MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB", mongoose.connection.name))
  .catch((err) => console.error("MongoDB connection error:", err));

// ✅ CORS config (dynamic, supports multiple origins & non-browser clients)
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // Allow mobile apps / curl
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    console.warn("🚫 CORS blocked origin:", origin);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));

app.use(bodyParser.json());
app.use(cookieParser());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api", mainRoutes);
app.use("/api", protectedRoutes);
app.use("/api", Ragroutes);

// Gemini agent
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

app.get("/", (req, res) => {
  res.status(200).json({
    "message": "Hey from backend of Medi-mitra",
    "ServerHealth": "Excellent"
  });
});

app.post("/api/gemini-agent", async (req, res) => {
  const { query } = req.body;
  const prompt = `
You are a simple healthcare assistant for rural patients in Nabha, Punjab.
- Respond in the same language as the query (English, Hindi, Punjabi).
- Reply short, clear, and friendly.
- Use Markdown with these sections:
  1. Possible Causes
  2. Basic Precautions
  3. Simple Home/Traditional Remedies
  4. Common OTC Medicines
  5. When to See a Doctor
  6. Serious Warning Signs

Patient says: "${query}"
`;
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response.text();
    res.json({ reply: response });
  } catch {
    res.status(500).json({ reply: "AI से जवाब नहीं मिला। कृपया बाद में प्रयास करें।" });
  }
});

// ✅ Socket.io setup (must use SAME server instance that we listen on)
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
      console.warn("🚫 Socket CORS blocked origin:", origin);
      return callback(new Error("Not allowed by Socket.io CORS"));
    },
    credentials: true,
  },
  transports: ["websocket", "polling"],
  pingTimeout: 60000,
  path: "/socket.io", // explicit for clarity
});
app.set("io", io);
initSocket(io); // initialize events & middleware

// Appointment completion
app.post("/api/appointments/complete", async (req, res) => {
  const { appointmentId } = req.body;
  try {
    const appointment = await Appointment.findByIdAndUpdate(appointmentId, { status: "completed" });
    if (!appointment) return res.status(404).json({ message: "Appointment not found" });
    io.to(appointment.doctor.toString()).emit("queue:update", { appointmentId });
    res.status(200).json({ message: "Appointment marked as completed" });
  } catch {
    res.status(500).json({ message: "Failed to mark appointment as completed" });
  }
});

// ✅ Get system IPv4 automatically
function getLocalIPv4() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === "IPv4" && !net.internal) {
        return net.address;
      }
    }
  }
  return "localhost";
}

// 🔍 Health & diagnostics
app.get("/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime(), timestamp: Date.now() });
});

// Start server (IMPORTANT: use server.listen for Socket.io to work)
server.listen(PORT, () => {
  const ipv4 = getLocalIPv4();
  console.log("🚀 Server listening:");
  console.log(`   Local:   http://localhost:${PORT}`);
  console.log(`   LAN:     http://${ipv4}:${PORT}`);
  console.log(`   Origins: ${ALLOWED_ORIGINS.join(", ")}`);
  console.log("📡 Socket.io namespace path: /socket.io");
});
