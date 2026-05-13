import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import eventsRouter from "./routes/events.js";
import authRouter from "./routes/auth.js";
import teamRouter from "./routes/team.js";
import uploadRouter from "./routes/upload.js";
import articlesRouter from "./routes/articles.js";
import careersRouter from "./routes/careers.js";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
import fs from "fs";

// Debug logging middleware
app.use((req, res, next) => {
  try {
    fs.appendFileSync("c:/Users/Madhavi Latha/OneDrive/Netopsys Projects/Wings-Project/api_debug.log", `[${new Date().toISOString()}] ${req.method} ${req.url}\n`);
  } catch (e) { }
  next();
});

const PORT = process.env.PORT || 5000;

// FIXED CORS CONFIGURATION - Allow all development origins
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) {
        callback(null, true);
        return;
      }

      // Allow all localhost origins (any port)
      const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);

      // Also allow common development ports
      const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:5173',
        'http://localhost:8080',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:8080'
      ];

      const isAllowedOrigin = allowedOrigins.includes(origin);

      if (isLocalhost || isAllowedOrigin) {
        callback(null, true);
        return;
      }

      // Log blocked origins for debugging
      console.log(`Blocked CORS request from: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  })
);

// Or use this simpler CORS configuration if the above doesn't work:
// app.use(cors({
//   origin: true, // This allows any origin in development
//   credentials: true
// }));

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

const uploadsPath = path.resolve(__dirname, "../uploads");
app.use("/api/uploads", express.static(uploadsPath));

// Add a test endpoint to verify API is working
app.get("/api/test", (_req, res) => {
  res.json({
    message: "API is working!",
    timestamp: new Date(),
    endpoints: {
      articles: "/api/articles",
      health: "/api/health"
    }
  });
});

// Add health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({
    status: "OK",
    server: "Running",
    timestamp: new Date()
  });
});

app.get("/", (_req, res) => {
  res.send("API Running Successfully");
});

app.use("/api", authRouter);
app.use("/api", eventsRouter);
app.use("/api", teamRouter);
app.use("/api", articlesRouter);
app.use("/api", careersRouter);
app.use("/api", uploadRouter);

import candidatesRouter from "./routes/candidates.js";
import applicationsRouter from "./routes/applications.js";
import interviewAvailabilityRouter from "./routes/interviewAvailbility.js";
import eventSubscribersRouter from "./routes/eventSubcriber.js";

app.use("/api", candidatesRouter);
app.use("/api", applicationsRouter);
app.use("/api", interviewAvailabilityRouter);
app.use("/api", eventSubscribersRouter);

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌐 API URL: http://localhost:${PORT}/api`);
  console.log(`📝 Test endpoint: http://localhost:${PORT}/api/test`);
  console.log(`📰 Articles endpoint: http://localhost:${PORT}/api/articles`);
});