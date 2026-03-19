import { 
  sendForgotPasswordOtp, 
  verifyForgotPasswordOtp, 
  resetPassword 
} from "../../services/driversServices/driverotpService.js"; // Make sure this path points to your actual otpservice file

// 1. Send OTP
export const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: "Email is required" 
      });
    }

    // Call the service function
    const result = await sendForgotPasswordOtp(email);

    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(404).json(result);
    }

  } catch (error) {
    console.error("Controller Error (Send OTP):", error);
    return res.status(500).json({ 
      success: false, 
      message: "Internal server error" 
    });
  }
};

// 2. Verify OTP
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ 
        success: false, 
        message: "Email and OTP are required" 
      });
    }

    const result = await verifyForgotPasswordOtp(email, otp);

    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(400).json(result);
    }

  } catch (error) {
    console.error("Controller Error (Verify OTP):", error);
    return res.status(500).json({ 
      success: false, 
      message: "Internal server error" 
    });
  }
};

// 3. Reset Password
export const resetPasswordController = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: "Email and new password are required" 
      });
    }

    const result = await resetPassword(email, newPassword);

    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(400).json(result);
    }

  } catch (error) {
    console.error("Controller Error (Reset Password):", error);
    return res.status(500).json({ 
      success: false, 
      message: "Internal server error" 
    });
  }
};