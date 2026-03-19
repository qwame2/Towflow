import express from "express";
import {
  sendForgotPasswordOtp,
  verifyForgotPasswordOtp,
  resetPassword,
} from "../../services/usersService/usersotpService.js";

const router = express.Router();

// Send OTP for password reset
router.post("/send-otp", async (req, res) => {
  try {
    const { email } = req.body;

    console.log("📥 Received forgot password OTP request for:", email);

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const result = await sendForgotPasswordOtp(email);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error("❌ Error in send-otp route:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Verify OTP for password reset
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    console.log("📥 Verifying OTP for:", email);

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    const result = await verifyForgotPasswordOtp(email, otp);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json({
      success: true,
      message: result.message,
      email: result.email,
    });
  } catch (error) {
    console.error("❌ Error in verify-otp route:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Reset password after OTP verification
router.post("/reset-password", async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    console.log("📥 Resetting password for:", email);

    if (!email || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Email and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const result = await resetPassword(email, newPassword);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error("❌ Error in reset-password route:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

export default router;
