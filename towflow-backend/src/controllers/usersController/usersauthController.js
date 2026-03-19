import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import {
  sendOtpEmail,
  verifyOtpService,
} from "../../services/usersService/usersotpService.js";
import { pool } from "../../config/db.js";

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_EXPIRES_IN = "30d"; // Token expires in 30 days

// Generate JWT token
const generateToken = (userId, email) => {
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// Health check endpoint for connection monitoring
export const healthCheck = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: "Server is healthy",
      timestamp: new Date().toISOString(),
      service: "TowFlow Auth API",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server health check failed",
    });
  }
};

// Send OTP for registration
export const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    console.log("📧 Sending OTP to:", email);

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Email is required",
      });
    }

    await pool.query("DELETE FROM email_otps WHERE email = $1", [email]);
    await sendOtpEmail(email);

    res.json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({
      success: false,
      error: "Failed to send OTP",
    });
  }
};

// Verify OTP
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    console.log("🔍 Verifying OTP:", { email, otp });

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        error: "Email and OTP are required",
      });
    }

    const result = await verifyOtpService(email, otp);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message || "Invalid or expired OTP",
      });
    }

    console.log("✅ OTP Verification Result:", {
      success: true,
      email: result.email,
      profileComplete: result.profileComplete,
      userExists: !!result.user,
    });

    res.json({
      success: true,
      message: "OTP verified successfully",
      email: result.email,
      profileComplete: result.profileComplete,
      user: result.user || null,
    });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({
      success: false,
      error: "Failed to verify OTP",
    });
  }
};

// Login user with email, username, or phone
export const loginUser = async (req, res) => {
  try {
    const { email, username, phone, password } = req.body;

    console.log("🔐 Login attempt received:", { email, username, phone });

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Password is required",
      });
    }

    // Determine login method and build query
    let query;
    let params;
    let loginMethod = "";

    if (email) {
      // Login with email
      query =
        "SELECT id, email, full_name, phone_number, username, password_hash, role, created_at FROM users WHERE email = $1";
      params = [email];
      loginMethod = "email";
    } else if (username) {
      // Login with username
      query =
        "SELECT id, email, full_name, phone_number, username, password_hash, role, created_at FROM users WHERE username = $1";
      params = [username];
      loginMethod = "username";
    } else if (phone) {
      // Login with phone number - IMPORTANT: Clean and format the phone number
      // Remove any spaces, dashes, parentheses, etc.
      const cleanPhone = phone.replace(/\D/g, ""); // Remove non-digits

      // Check if phone has country code, if not add default
      let formattedPhone = cleanPhone;
      if (cleanPhone.length === 10) {
        // Assume it's a Ghanaian number without country code
        formattedPhone = "233" + cleanPhone.substring(1); // Convert to +233 format
      } else if (cleanPhone.length === 9 && cleanPhone.startsWith("0")) {
        // Handle 0XXXXXXXX format
        formattedPhone = "233" + cleanPhone.substring(1);
      }

      console.log(
        `📱 Phone login attempt: original=${phone}, clean=${cleanPhone}, formatted=${formattedPhone}`
      );

      // Try multiple phone formats
      query = `
        SELECT id, email, full_name, phone_number, username, password_hash, role, created_at 
        FROM users 
        WHERE 
          phone_number = $1 OR 
          phone_number = $2 OR 
          phone_number = $3 OR
          REPLACE(REPLACE(REPLACE(REPLACE(phone_number, ' ', ''), '-', ''), '(', ''), ')', '') = $4
        LIMIT 1
      `;
      params = [phone, cleanPhone, formattedPhone, cleanPhone];
      loginMethod = "phone";
    } else {
      return res.status(400).json({
        success: false,
        message: "Email, username, or phone number is required",
      });
    }

    console.log(`🔍 Searching user by ${loginMethod} with params:`, params);

    // 1. Find user
    const userResult = await pool.query(query, params);

    console.log(`📊 Found ${userResult.rows.length} user(s)`);

    if (userResult.rows.length === 0) {
      console.log(
        `❌ Login failed: No user found with ${loginMethod}:`,
        params[0]
      );
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const user = userResult.rows[0];

    // 2. Check if user has a password set
    if (!user.password_hash) {
      console.log("❌ Login failed: No password set for user");
      return res.status(401).json({
        success: false,
        message: "Please use forgot password to set your password first",
      });
    }

    // 3. Validate password
    console.log("🔐 Validating password...");
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      console.log("❌ Login failed: Invalid password");
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // 4. Generate JWT token
    const token = generateToken(user.id, user.email);

    // 5. Remove password hash from response
    const { password_hash, ...userWithoutPassword } = user;

    console.log(
      `✅ Login successful for user ID: ${user.id} via ${loginMethod}`
    );

    res.json({
      success: true,
      message: "Login successful",
      user: userWithoutPassword,
      token: token,
    });
  } catch (error) {
    console.error("❌ Login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Complete user profile after OTP verification
export const completeProfile = async (req, res) => {
  let hashedPassword;

  try {
    const { email, fullName, phoneNumber, username, password, profilePicture } =
      req.body;

    console.log("📝 Completing profile for:", {
      email,
      fullName,
      phoneNumber,
      username,
      hasPassword: !!password,
      profilePicture: !!profilePicture,
    });

    if (!email || !fullName || !phoneNumber || !username || !password) {
      return res.status(400).json({
        success: false,
        error:
          "Email, full name, phone number, username, and password are required",
      });
    }

    // Check if user already exists by email
    const existingUserByEmail = await pool.query(
      `SELECT * FROM users WHERE email = $1`,
      [email]
    );

    if (existingUserByEmail.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: "User with this email already exists",
      });
    }

    // Check if username is already taken
    const existingUserByUsername = await pool.query(
      `SELECT * FROM users WHERE username = $1`,
      [username]
    );

    if (existingUserByUsername.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: "Username is already taken",
      });
    }

    // Hash the password
    const saltRounds = 10;
    hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert new user with all fields
    const result = await pool.query(
      `INSERT INTO users (email, full_name, phone_number, username, password_hash, profile_picture, role, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, 'customer', NOW()) RETURNING *`,
      [
        email,
        fullName,
        phoneNumber,
        username,
        hashedPassword,
        profilePicture || null,
      ]
    );

    const user = result.rows[0];

    // Generate JWT token
    const token = generateToken(user.id, user.email);

    console.log("✅ Profile completed successfully");

    // Don't send password hash in response
    const userResponse = {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      phone_number: user.phone_number,
      username: user.username,
      profile_picture: user.profile_picture,
      role: user.role,
      created_at: user.created_at,
    };

    res.json({
      success: true,
      message: "Profile completed successfully",
      user: userResponse,
      token: token,
    });
  } catch (error) {
    console.error("Error completing profile:", error);

    // Handle role constraint error
    if (error.constraint === "users_role_check") {
      try {
        console.log("🔄 Retrying with role: 'client'");
        const result = await pool.query(
          `INSERT INTO users (email, full_name, phone_number, username, password_hash, profile_picture, role, created_at) 
           VALUES ($1, $2, $3, $4, $5, $6, 'client', NOW()) RETURNING *`,
          [
            email,
            fullName,
            phoneNumber,
            username,
            hashedPassword,
            profilePicture,
          ]
        );

        const user = result.rows[0];
        const token = generateToken(user.id, user.email);

        // Don't send password hash in response
        const userResponse = {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          phone_number: user.phone_number,
          username: user.username,
          profile_picture: user.profile_picture,
          role: user.role,
          created_at: user.created_at,
        };

        return res.json({
          success: true,
          message: "Profile completed successfully",
          user: userResponse,
          token: token,
        });
      } catch (retryError) {
        console.error("Retry failed:", retryError);
        res.status(500).json({
          success: false,
          error: "Invalid role. Please check database constraints.",
        });
      }
    } else if (error.constraint === "users_username_key") {
      // Handle unique username constraint
      res.status(400).json({
        success: false,
        error: "Username is already taken",
      });
    } else {
      console.error("Database error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to complete profile: " + error.message,
      });
    }
  }
};

// Get user profile with token verification
export const getProfile = async (req, res) => {
  try {
    const userId = req.userId;

    const result = await pool.query(
      `SELECT id, email, full_name, phone_number, username, profile_picture, role, created_at 
       FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    res.json({
      success: true,
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Error getting profile:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get profile",
    });
  }
};

// Update user profile (including profile picture)
// Update user profile (including profile picture)
export const updateProfile = async (req, res) => {
  try {
    const userId = req.userId;
    // 1. FIX: Destructure both naming conventions
    const {
      full_name,
      username,
      phone_number,
      profile_picture, // snake_case
      profilePicture, // camelCase (common in frontend)
      currentPassword,
      newPassword,
    } = req.body;

    // 2. FIX: Consolidate image data
    const imageToSave = profile_picture || profilePicture;

    console.log(`🔄 Updating profile for user ID: ${userId}`);

    // 3. FIX: Updated Validation Logic
    if (
      full_name === undefined &&
      username === undefined &&
      phone_number === undefined &&
      imageToSave === undefined &&
      newPassword === undefined
    ) {
      return res.status(400).json({
        success: false,
        error: "No fields provided to update",
      });
    }

    // 4. FIX: Increase Size Limit (Set to 5MB = ~6.5M chars base64)
    // 5MB image ≈ 6,666,666 base64 characters.
    if (imageToSave && imageToSave.length > 7000000) {
      return res.status(400).json({
        success: false,
        error: "Image is too large. Please use a smaller image (max 5MB).",
      });
    }

    // Dynamic Query Construction
    let fields = [];
    let values = [];
    let paramIndex = 1;

    if (full_name !== undefined) {
      fields.push(`full_name = $${paramIndex++}`);
      values.push(full_name);
    }
    if (username !== undefined) {
      fields.push(`username = $${paramIndex++}`);
      values.push(username);
    }
    if (phone_number !== undefined) {
      fields.push(`phone_number = $${paramIndex++}`);
      values.push(phone_number);
    }

    // 5. FIX: Use the consolidated image variable
    if (imageToSave !== undefined) {
      fields.push(`profile_picture = $${paramIndex++}`);
      values.push(imageToSave);
    }

    // Handle Password Change
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          error: "Current password is required to change password",
        });
      }

      const userResult = await pool.query(
        "SELECT password_hash FROM users WHERE id = $1",
        [userId]
      );
      const user = userResult.rows[0];

      if (!user) {
        return res
          .status(404)
          .json({ success: false, error: "User not found" });
      }

      const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isMatch) {
        return res
          .status(401)
          .json({ success: false, error: "Incorrect current password" });
      }

      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      fields.push(`password_hash = $${paramIndex++}`);
      values.push(hashedPassword);
    }

    fields.push("updated_at = NOW()");
    values.push(userId);

    const query = `
      UPDATE users 
      SET ${fields.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING id, email, full_name, phone_number, username, profile_picture, role, created_at, updated_at
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    const updatedUser = result.rows[0];
    console.log(`✅ Profile updated successfully for user ID: ${userId}`);

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("❌ Error updating profile:", error);

    if (error.constraint === "users_username_key") {
      return res.status(400).json({
        success: false,
        error: "Username is already taken",
      });
    }

    if (
      error.code === "22001" ||
      error.message?.includes("value too long") ||
      error.message?.includes("string too long")
    ) {
      return res.status(413).json({
        success: false,
        error: "Image is too large for the database.",
      });
    }

    res.status(500).json({
      success: false,
      error:
        "Failed to update profile: " +
        (error.message || "Internal server error"),
    });
  }
};

// Auth middleware to verify token
export const authMiddleware = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({
      success: false,
      error: "No token, authorization denied",
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    next();
  } catch (error) {
    console.error("❌ Token verification failed:", error.message);

    // Provide more specific error messages
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        error: "Token has expired. Please log in again.",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        error: "Invalid token. Please log in again.",
      });
    }

    res.status(401).json({
      success: false,
      error: "Token is not valid",
    });
  }
};

// Debug endpoint: Get all OTPs
export const debugOtps = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM email_otps ORDER BY created_at DESC"
    );
    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Debug endpoint: Clear all OTPs
export const clearOtps = async (req, res) => {
  try {
    await pool.query("DELETE FROM email_otps");
    res.json({
      success: true,
      message: "All OTPs cleared",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Debug endpoint: Get all users
export const debugUsers = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, email, full_name, phone_number, username, role, created_at, updated_at FROM users ORDER BY created_at DESC"
    );
    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
