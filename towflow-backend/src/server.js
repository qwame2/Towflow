import express from "express";
import dotenv from "dotenv";
import cors from "cors";
// ✅ 1. NEW IMPORTS needed for file paths in ES Modules
import path from "path";
import { fileURLToPath } from "url";

// Routes Imports
import userAuthRoutes from "./routes/usersRoute/userAuthRoutes.js";
import passwordResetRoutes from "./routes/usersRoute/passwordResetRoutes.js";
import driverAuthRoutes from "./routes/driversRoute/driverAuthRoutes.js";
import driverPasswordResetRoutes from "./routes/driversRoute/driverpasswordResetRoutes.js";
import driverLocationRoutes from "./routes/driversRoute/driverLocationRoutes.js";
import vehicleRoutes from "./routes/usersRoute/vehicleRoutes.js";

// Make sure this file actually exists at this path!
import driverProfileRoutes from "./routes/driversRoute/driverAuthRoutes.js"; // Renamed for clarity based on usage below

dotenv.config();

// ✅ 2. SETUP DIRECTORY PATHS (Required for ES Modules)
const __filename = fileURLToPath(import.meta.url);
// This assumes this server file is at the root of your project.
// If it's inside a 'src' folder, you might need: path.resolve(path.dirname(__filename), '..');
const __dirname = path.dirname(__filename);

const app = express();

// CORS MUST BE AT THE TOP
app.use(cors());

// Body parsers
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true, limit: "100mb" }));

// Request logger
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path}`);
  next();
});

// ==========================================
// ✅ 3. CRITICAL FIX: SERVE STATIC IMAGES
// ==========================================
// This tells Express: "When a request comes for '/uploads/xyz.jpg',
// look for the file in the local folder named 'uploads'."
//
// IMPORTANT: Ensure you have a folder named exactly 'uploads'
// at the same level as this server file.
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
console.log(`📂 Serving static files from: ${path.join(__dirname, "uploads")}`);
// ==========================================

// --- REGISTER ROUTES ---

// USERS
app.use("/api/auth", userAuthRoutes);
app.use("/api/password-reset", passwordResetRoutes);
app.use("/api/vehicles", vehicleRoutes);

// DRIVERS
app.use("/driver/auth", driverAuthRoutes);
app.use("/driver/password-reset", driverPasswordResetRoutes);
app.use("/api/drivers", driverLocationRoutes);

// Connects the Profile endpoint. Matches: GET /api/driver/profile
app.use("/api/driver", driverProfileRoutes);

// Catch-all route (404)
app.use((req, res) => {
  console.log(`❌ Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    error: "Route not found",
    availableRoutes: [
      "POST /driver/password-reset/send-otp",
      "POST /driver/auth/login",
      "GET /api/driver/profile",
    ],
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  // Add a helpful log reminding you where images should go
  console.log(
    `👉 Ensure images are saved in the 'uploads' folder inside: ${__dirname}`
  );
});
