import { pool } from "../../config/db.js";
import nodemailer from "nodemailer";
import bcrypt from "bcrypt";

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

let transporter = createTransporter();

// --- FORGOT PASSWORD OTP FUNCTIONS ---

// FORGOT PASSWORD FUNCTIONS

export const sendForgotPasswordOtp = async (email) => {
  try {
    console.log("🔧 Starting forgot password OTP for:", email);

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Check if user exists
    const userCheck = await pool.query(
      "SELECT id, email FROM users WHERE email = $1",
      [email]
    );

    if (userCheck.rows.length === 0) {
      console.log("❌ User not found with email:", email);
      return {
        success: false,
        message: "No account found with this email address",
      };
    }

    console.log("✅ User found for password reset:", userCheck.rows[0]);

    // ⚠️ REMOVE OR COMMENT OUT THESE LINES - YOU CREATED THE TABLE MANUALLY ⚠️
    // await pool.query(`
    //   CREATE TABLE IF NOT EXISTS password_reset_otps (
    //     id SERIAL PRIMARY KEY,
    //     email VARCHAR(255) NOT NULL,
    //     otp VARCHAR(6) NOT NULL,
    //     expires_at TIMESTAMP NOT NULL,
    //     created_at TIMESTAMP DEFAULT NOW(),
    //     UNIQUE(email, otp)
    //   )
    // `);

    // Clear any existing OTPs for this email
    await pool.query("DELETE FROM password_reset_otps WHERE email = $1", [
      email,
    ]);

    // Save OTP to database
    await pool.query(
      `INSERT INTO password_reset_otps (email, otp, expires_at, created_at) 
       VALUES ($1, $2, $3, NOW())`,
      [email, otp, expiresAt]
    );

    console.log("💾 Password reset OTP saved to database");

    // Send email using your existing transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: `"TowFlow" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Password Reset OTP - TowFlow",
      text: `Your TowFlow password reset OTP is: ${otp}. This code expires in 5 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #32CD32; margin-bottom: 10px;">TowFlow</h1>
            <p style="color: #666;">Password Reset Request</p>
          </div>
          
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <p style="color: #333; margin-bottom: 15px;">
              You requested to reset your password for your TowFlow account. 
              Please use the OTP code below:
            </p>
            
            <div style="text-align: center; margin: 20px 0;">
              <div style="display: inline-block; background-color: #fff; padding: 15px 25px; border-radius: 8px; border: 2px solid #32CD32;">
                <span style="font-size: 28px; font-weight: bold; color: #32CD32; letter-spacing: 5px;">${otp}</span>
              </div>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              This OTP will expire in 5 minutes. If you didn't request this password reset, please ignore this email.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 12px;">
              © ${new Date().getFullYear()} TowFlow. All rights reserved.
            </p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log("📤 Password reset OTP email sent to:", email);

    return {
      success: true,
      message: "OTP sent successfully to your email",
    };
  } catch (error) {
    console.error("❌ Error in sendForgotPasswordOtp:", error);
    return {
      success: false,
      message: error.message || "Failed to send OTP",
    };
  }
};

export const verifyForgotPasswordOtp = async (email, otp) => {
  try {
    console.log("🔐 Verifying forgot password OTP:", { email, otp });

    // Clean up expired OTPs
    await pool.query(
      "DELETE FROM password_reset_otps WHERE expires_at < NOW()"
    );

    // Verify OTP
    const result = await pool.query(
      `SELECT * FROM password_reset_otps 
       WHERE email = $1 AND otp = $2 AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [email, otp]
    );

    console.log("📊 OTP verification result count:", result.rows.length);

    if (result.rows.length === 0) {
      return {
        success: false,
        message: "Invalid or expired OTP",
      };
    }

    // Delete the used OTP
    await pool.query(
      "DELETE FROM password_reset_otps WHERE email = $1 AND otp = $2",
      [email, otp]
    );

    return {
      success: true,
      message: "OTP verified successfully",
      email: email,
    };
  } catch (error) {
    console.error("❌ Error in verifyForgotPasswordOtp:", error);
    return {
      success: false,
      message: error.message || "Failed to verify OTP",
    };
  }
};

export const resetPassword = async (email, newPassword) => {
  try {
    console.log("🔄 Resetting password for:", email);

    // Check if user exists
    const userResult = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (userResult.rows.length === 0) {
      return {
        success: false,
        message: "User not found",
      };
    }

    const userId = userResult.rows[0].id;

    // IMPORTANT: Hash the password before saving to password_hash column
    // If you're using bcrypt for hashing (which you should be!)
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update the password_hash column (not password)
    await pool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [
      hashedPassword,
      userId,
    ]);

    console.log("✅ Password reset successfully for user ID:", userId);

    // Clear all OTPs for this email
    await pool.query("DELETE FROM password_reset_otps WHERE email = $1", [
      email,
    ]);

    return {
      success: true,
      message: "Password reset successfully",
    };
  } catch (error) {
    console.error("❌ Error in resetPassword:", error);
    return {
      success: false,
      message: error.message || "Failed to reset password",
    };
  }
};

export const sendOtpEmail = async (email) => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  console.log("💾 Saving OTP to database:", { email, otp, expiresAt });

  // Clear any existing OTPs for this email first
  await pool.query("DELETE FROM email_otps WHERE email = $1", [email]);

  await pool.query(
    `INSERT INTO email_otps (email, otp, expires_at, created_at) 
     VALUES ($1, $2, $3, NOW())`,
    [email, otp, expiresAt]
  );

  // Verify it was saved
  const check = await pool.query(
    "SELECT * FROM email_otps WHERE email = $1 ORDER BY created_at DESC LIMIT 1",
    [email]
  );
  console.log("✅ OTP saved:", check.rows[0]);

  // Send email
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: "TowFlow <no-reply@towflow.app>",
    to: email,
    subject: "Your TowFlow Login OTP",
    text: `Your OTP is ${otp}. It expires in 5 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #32CD32;">TowFlow Verification</h2>
        <p>Your verification code is:</p>
        <h1 style="font-size: 32px; color: #32CD32; letter-spacing: 5px;">${otp}</h1>
        <p>This code will expire in 5 minutes.</p>
        <p>If you didn't request this code, please ignore this email.</p>
      </div>
    `,
  });

  console.log("📤 OTP email sent successfully to:", email);
  return true;
};

export const verifyOtpService = async (email, otp) => {
  console.log("🔐 Verifying OTP for:", { email, otp });

  // First, clean up expired OTPs
  await pool.query("DELETE FROM email_otps WHERE expires_at < NOW()");

  const result = await pool.query(
    `SELECT * FROM email_otps 
     WHERE email = $1 AND otp = $2 AND expires_at > NOW()`,
    [email, otp]
  );

  console.log("📊 OTP query result:", result.rows);

  if (result.rows.length === 0) {
    return {
      success: false,
      message: "Invalid or expired OTP",
    };
  }

  // Delete the used OTP
  await pool.query(`DELETE FROM email_otps WHERE email = $1 AND otp = $2`, [
    email,
    otp,
  ]);

  // Check if user already exists
  const userResult = await pool.query(`SELECT * FROM users WHERE email = $1`, [
    email,
  ]);

  console.log("👤 User check result:", {
    userExists: userResult.rows.length > 0,
    userCount: userResult.rows.length,
  });

  if (userResult.rows.length > 0) {
    // User exists - profile is complete
    return {
      success: true,
      user: userResult.rows[0],
      profileComplete: true, // ✅ This should be TRUE for existing users
      email: email,
    };
  } else {
    // New user - profile is NOT complete
    return {
      success: true,
      email: email,
      profileComplete: false, // ✅ This should be FALSE for new users
      user: null,
    };
  }
};
