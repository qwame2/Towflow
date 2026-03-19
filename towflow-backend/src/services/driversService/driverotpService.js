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

// ==========================================
// 1. LOGIN OTP FUNCTIONS (Keep these)
// ==========================================

export const sendOtpEmail = async (email) => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  // Clear existing login OTPs
  await pool.query("DELETE FROM email_otps WHERE email = $1", [email]);

  await pool.query(
    `INSERT INTO email_otps (email, otp, expires_at, created_at) VALUES ($1, $2, $3, NOW())`,
    [email, otp, expiresAt]
  );

  const transporter = createTransporter();
  await transporter.sendMail({
    from: "TowFlow <no-reply@towflow.app>",
    to: email,
    subject: "Your TowFlow Login OTP",
    text: `Your OTP is ${otp}`,
  });
  console.log("📤 Login OTP sent to:", email);
  return true;
};

export const verifyOtpService = async (email, otp) => {
  await pool.query("DELETE FROM email_otps WHERE expires_at < NOW()");

  const result = await pool.query(
    `SELECT * FROM email_otps WHERE email = $1 AND otp = $2 AND expires_at > NOW()`,
    [email, otp]
  );

  if (result.rows.length === 0)
    return { success: false, message: "Invalid or expired OTP" };

  await pool.query(`DELETE FROM email_otps WHERE email = $1 AND otp = $2`, [
    email,
    otp,
  ]);

  // Check DRIVERS table for login
  const driverResult = await pool.query(
    `SELECT * FROM drivers WHERE email = $1`,
    [email]
  );

  if (driverResult.rows.length > 0) {
    return {
      success: true,
      user: driverResult.rows[0],
      profileComplete: true,
      email: email,
    };
  } else {
    return { success: true, email: email, profileComplete: false, user: null };
  }
};

// ==========================================
// 2. PASSWORD RESET FUNCTIONS (Corrected)
// ==========================================

export const sendDriverForgotPasswordOtp = async (email) => {
  try {
    console.log("🔧 Starting driver password reset for:", email);

    // ✅ FIXED: Checking DRIVERS table instead of users
    const driverCheck = await pool.query(
      "SELECT id FROM drivers WHERE email = $1",
      [email]
    );

    if (driverCheck.rows.length === 0) {
      console.log("❌ Driver not found in DB");
      return {
        success: false,
        message: "No driver account found with this email",
      };
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Use the shared password_reset_otps table
    await pool.query("DELETE FROM password_reset_otps WHERE email = $1", [
      email,
    ]);

    await pool.query(
      `INSERT INTO password_reset_otps (email, otp, expires_at, created_at) VALUES ($1, $2, $3, NOW())`,
      [email, otp, expiresAt]
    );

    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"TowFlow Driver Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Driver Password Reset OTP - TowFlow",
      text: `Your OTP is: ${otp}`,
    });

    console.log("✅ OTP sent to driver:", email);
    return { success: true, message: "OTP sent to driver email" };
  } catch (error) {
    console.error("❌ Driver OTP Error:", error);
    return { success: false, message: "Failed to send OTP" };
  }
};

export const verifyForgotPasswordOtp = async (email, otp) => {
  try {
    // Clean expired
    await pool.query(
      "DELETE FROM password_reset_otps WHERE expires_at < NOW()"
    );

    // Check OTP
    const result = await pool.query(
      `SELECT * FROM password_reset_otps 
       WHERE email = $1 AND otp = $2 AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [email, otp]
    );

    if (result.rows.length === 0) {
      return { success: false, message: "Invalid or expired OTP" };
    }

    // Delete used OTP
    await pool.query(
      "DELETE FROM password_reset_otps WHERE email = $1 AND otp = $2",
      [email, otp]
    );

    return { success: true, message: "OTP verified", email: email };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const resetDriverPassword = async (email, newPassword) => {
  try {
    // ✅ FIXED: Checking DRIVERS table
    const driverResult = await pool.query(
      "SELECT id FROM drivers WHERE email = $1",
      [email]
    );
    if (driverResult.rows.length === 0)
      return { success: false, message: "Driver not found" };

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // ✅ FIXED: Updating DRIVERS table
    await pool.query("UPDATE drivers SET password_hash = $1 WHERE id = $2", [
      hashedPassword,
      driverResult.rows[0].id,
    ]);

    // Cleanup any leftover OTPs
    await pool.query("DELETE FROM password_reset_otps WHERE email = $1", [
      email,
    ]);

    return { success: true, message: "Driver password reset successfully" };
  } catch (error) {
    console.error("❌ Driver Reset Error:", error);
    return { success: false, message: "Failed to reset password" };
  }
};
