import express from "express";
import { 
  sendOtp,
  verifyOtp,
  completeProfile,
  loginUser,
  getProfile,
  updateProfile,
  healthCheck,
  debugOtps,
  clearOtps,
  debugUsers,
  authMiddleware
} from "../../controllers/usersController/usersauthController.js"; // ← CHANGE THIS PATH

const router = express.Router();

// Public routes
router.get("/health", healthCheck);
router.post("/request-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/complete-profile", completeProfile);
router.post("/login", loginUser);

// Protected routes (require authentication)
router.get("/profile", authMiddleware, getProfile);
router.put("/profile", authMiddleware, updateProfile);

// Debug routes
router.get("/debug-otps", debugOtps);
router.delete("/clear-otps", clearOtps);
router.get("/debug-users", debugUsers);

export default router;