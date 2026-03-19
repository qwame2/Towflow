import express from "express";
import {
  sendOtpController,
  verifyOtpController,
  resetPasswordController,
} from "../../controllers/driversController/driversauthController.js";

const router = express.Router();

// The frontend calls: /driver/password-reset/send-otp
router.post("/send-otp", sendOtpController);
router.post("/verify-otp", verifyOtpController);
router.post("/reset-password", resetPasswordController);

export default router;
