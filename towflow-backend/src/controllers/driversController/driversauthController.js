// ✅ Import DB, Bcrypt, JWT, and Dotenv
import { pool } from "../../config/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

// ✅ Import Service Functions for OTPs
import {
  sendOtpEmail,
  sendDriverForgotPasswordOtp,
  verifyForgotPasswordOtp,
  resetDriverPassword,
} from "../../services/driversService/driverotpService.js";

dotenv.config();

// ==========================================
// 1. AUTHENTICATION & OTP FUNCTIONS
// ==========================================

// Login OTP
export const requestOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
    }
    console.log("⚡ Endpoint hit: Requesting OTP for", email);
    await sendOtpEmail(email);
    return res
      .status(200)
      .json({ success: true, message: "OTP sent successfully" });
  } catch (error) {
    console.error("❌ Controller Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to send verification code." });
  }
};

// Forgot Password - Send OTP
export const sendOtpController = async (req, res) => {
  try {
    const { email } = req.body;
    const result = await sendDriverForgotPasswordOtp(email);
    if (result.success) return res.status(200).json(result);
    return res.status(404).json(result);
  } catch (error) {
    console.error("❌ Send Reset OTP Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ==========================================
// 2. COMPLETE PROFILE (REGISTRATION)
// ==========================================

export const completeProfile = async (req, res) => {
  const client = await pool.connect(); // Get a dedicated client for transaction

  try {
    const {
      role,
      name,
      phone,
      email,
      profile_photo,
      id_document,
      password,
      driver_details,
      repair_details,
      fuel_details,
      // Location fields
      latitude,
      longitude,
      heading,
      status,
    } = req.body;

    // 1. Hash Password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 2. Prepare Defaults
    const defaultRating = 5.0;
    const defaultPrice = 15.0;

    // 3. Start Transaction
    await client.query("BEGIN");

    // 4. Insert into driver_users Table
    const userInsertQuery = `
      INSERT INTO driver_users (
        email, phone, password_hash, full_name, role, 
        profile_photo_url, id_document_url, is_verified,
        latitude, longitude, heading, status,
        rating, price_per_km
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, true, $8, $9, $10, $11, $12, $13)
      RETURNING user_id; 
    `;

    const userRes = await client.query(userInsertQuery, [
      email,
      phone,
      passwordHash,
      name,
      role,
      profile_photo,
      id_document,
      // Location Defaults
      latitude || null,
      longitude || null,
      heading || 0,
      status || "offline",
      // New Fields Data
      defaultRating,
      defaultPrice,
    ]);

    const newUserId = userRes.rows[0].user_id;
    console.log(`👤 Driver User created with ID: ${newUserId}, Role: ${role}`);

    // 5. Insert into Role-Specific Tables
    if (role === "driver" && driver_details) {
      const { vehicle, driver_license } = driver_details;

      await client.query(
        `
        INSERT INTO drivers (
          user_id, driver_license_url, plate_number, vehicle_model, 
          tow_type, tow_capacity, insurance_doc_url, 
          registration_doc_url, tow_truck_photo_url
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `,
        [
          newUserId,
          driver_license,
          vehicle.plate_number,
          vehicle.model,
          vehicle.tow_type,
          vehicle.tow_capacity,
          vehicle.insurance_document,
          vehicle.registration_document,
          vehicle.tow_truck_photo,
        ]
      );
    } else if (role === "repair" && repair_details) {
      const businessName = repair_details.is_company
        ? repair_details.company_name
        : repair_details.shop_name;
      const regNumber = repair_details.company_reg_number || null;
      const phoneContact = repair_details.office_phone || phone;
      const address = repair_details.is_company
        ? repair_details.company_address
        : repair_details.shop_location;

      const shopRes = await client.query(
        `
        INSERT INTO repair_shops (
          user_id, is_company, business_name, reg_number, office_phone, 
          company_email, website_url, address_gps, operating_hours,
          business_cert_url, certifications_url, logo_url,
          manager_name, manager_phone, manager_email
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING shop_id
      `,
        [
          newUserId,
          repair_details.is_company,
          businessName,
          regNumber,
          phoneContact,
          repair_details.company_email,
          repair_details.website,
          address,
          repair_details.operating_hours,
          repair_details.business_cert,
          repair_details.certifications,
          repair_details.company_logo,
          repair_details.manager?.name,
          repair_details.manager?.phone,
          repair_details.manager?.email,
        ]
      );

      // Handle Mechanics Loop
      if (repair_details.mechanics && repair_details.mechanics.length > 0) {
        const shopId = shopRes.rows[0].shop_id;
        for (const mech of repair_details.mechanics) {
          await client.query(
            `
            INSERT INTO mechanics (shop_id, full_name, role_title, experience_years, certification_doc_url, profile_pic_url)
            VALUES ($1, $2, $3, $4, $5, $6)
          `,
            [
              shopId,
              mech.name,
              mech.role,
              mech.experience,
              mech.certification,
              mech.profilePic,
            ]
          );
        }
      }
    } else if (role === "fuel" && fuel_details) {
      await client.query(
        `
        INSERT INTO fuel_stations (
          user_id, company_name, station_name, reg_number, 
          license_doc_url, logo_url, station_address, 
          manager_contact, operating_hours, available_fuel_types
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `,
        [
          newUserId,
          fuel_details.company_name,
          fuel_details.station_name,
          fuel_details.reg_number,
          fuel_details.license_doc,
          fuel_details.logo,
          fuel_details.station_address,
          fuel_details.manager_contact,
          fuel_details.operating_hours,
          fuel_details.fuel_types,
        ]
      );
    }

    // 6. Commit Transaction
    await client.query("COMMIT");
    res
      .status(201)
      .json({ success: true, message: "Profile completed successfully" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Registration Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Registration failed",
    });
  } finally {
    client.release();
  }
};

// ==========================================
// 3. LOGIN CONTROLLER
// ==========================================
export const login = async (req, res) => {
  console.time("⚡ Total Login Time");

  try {
    const { email, phone, username, password } = req.body;
    const identifier = email || phone || username;

    if (!identifier || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Credentials required" });
    }

    console.log("⚡ Login attempt for:", identifier);

    console.time("🔍 Database Query");
    const userResult = await pool.query(
      `SELECT * FROM driver_users WHERE email = $1 OR phone = $1 OR full_name = $1`,
      [identifier]
    );
    console.timeEnd("🔍 Database Query");

    if (userResult.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Account not found" });
    }

    const user = userResult.rows[0];

    console.time("🔐 Password Verify");
    const isMatch = await bcrypt.compare(password, user.password_hash);
    console.timeEnd("🔐 Password Verify");

    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid password" });
    }

    // GENERATE TOKEN
    const token = jwt.sign(
      { id: user.user_id, role: user.role },
      process.env.JWT_SECRET || "fallback_secret_key_change_in_production",
      { expiresIn: "30d" }
    );

    console.timeEnd("⚡ Total Login Time");

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token: token,
      user: {
        id: user.user_id,
        name: user.full_name,
        email: user.email,
        phone_number: user.phone,
        role: user.role,
        profile_photo_url: user.profile_photo_url,
      },
    });
  } catch (error) {
    console.error("❌ Login Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ==========================================
// 4. UPDATE DRIVER PROFILE
// ==========================================
export const updateDriverProfile = async (req, res) => {
  const client = await pool.connect();
  try {
    const driverId = req.user.id;

    const {
      full_name,
      phone_number,
      profile_photo_url,
      current_password,
      new_password,
      driver_details,
    } = req.body;

    console.log(`🔄 Updating profile for user ID: ${driverId}`);

    await client.query("BEGIN");

    // --- 1. PASSWORD CHANGE ---
    if (current_password && new_password) {
      const userResult = await client.query(
        "SELECT password_hash FROM driver_users WHERE user_id = $1",
        [driverId]
      );

      if (userResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ message: "Driver not found." });
      }

      const validPassword = await bcrypt.compare(
        current_password,
        userResult.rows[0].password_hash
      );

      if (!validPassword) {
        await client.query("ROLLBACK");
        return res.status(400).json({ message: "Incorrect current password." });
      }

      const salt = await bcrypt.genSalt(10);
      const newPasswordHash = await bcrypt.hash(new_password, salt);
      await client.query(
        "UPDATE driver_users SET password_hash = $1, updated_at = NOW() WHERE user_id = $2",
        [newPasswordHash, driverId]
      );
      console.log("🔑 Password updated successfully.");
    }

    // --- 2. USER UPDATE ---
    const userUpdates = [];
    const userValues = [];
    let userParamIndex = 1;

    if (full_name !== undefined) {
      userUpdates.push(`full_name = $${userParamIndex}`);
      userValues.push(full_name);
      userParamIndex++;
    }
    if (phone_number !== undefined) {
      userUpdates.push(`phone = $${userParamIndex}`);
      userValues.push(phone_number);
      userParamIndex++;
    }
    if (profile_photo_url !== undefined) {
      userUpdates.push(`profile_photo_url = $${userParamIndex}`);
      userValues.push(profile_photo_url);
      userParamIndex++;
    }

    if (userUpdates.length > 0) {
      userUpdates.push(`updated_at = NOW()`);
      userValues.push(driverId);
      const userQuery = `
        UPDATE driver_users
        SET ${userUpdates.join(", ")}
        WHERE user_id = $${userParamIndex}
      `;
      await client.query(userQuery, userValues);
    }

    // --- 3. VEHICLE UPDATE ---
    if (driver_details && driver_details.vehicle) {
      const vehicle = driver_details.vehicle;
      const vehicleUpdates = [];
      const vehicleValues = [];
      let vehicleParamIndex = 1;

      if (vehicle.tow_type !== undefined) {
        vehicleUpdates.push(`tow_type = $${vehicleParamIndex}`);
        vehicleValues.push(vehicle.tow_type);
        vehicleParamIndex++;
      }
      if (vehicle.plate_number !== undefined) {
        vehicleUpdates.push(`plate_number = $${vehicleParamIndex}`);
        vehicleValues.push(vehicle.plate_number);
        vehicleParamIndex++;
      }
      if (vehicle.model !== undefined) {
        vehicleUpdates.push(`vehicle_model = $${vehicleParamIndex}`);
        vehicleValues.push(vehicle.model);
        vehicleParamIndex++;
      }
      if (vehicle.tow_capacity !== undefined) {
        vehicleUpdates.push(`tow_capacity = $${vehicleParamIndex}`);
        vehicleValues.push(vehicle.tow_capacity);
        vehicleParamIndex++;
      }
      if (vehicle.insurance_document_url !== undefined) {
        vehicleUpdates.push(`insurance_doc_url = $${vehicleParamIndex}`);
        vehicleValues.push(vehicle.insurance_document_url);
        vehicleParamIndex++;
      }
      if (vehicle.registration_document_url !== undefined) {
        vehicleUpdates.push(`registration_doc_url = $${vehicleParamIndex}`);
        vehicleValues.push(vehicle.registration_document_url);
        vehicleParamIndex++;
      }
      if (vehicle.tow_truck_photo_url !== undefined) {
        vehicleUpdates.push(`tow_truck_photo_url = $${vehicleParamIndex}`);
        vehicleValues.push(vehicle.tow_truck_photo_url);
        vehicleParamIndex++;
      }

      if (vehicleUpdates.length > 0) {
        vehicleValues.push(driverId);
        const driverExistsRes = await client.query(
          "SELECT 1 FROM drivers WHERE user_id = $1",
          [driverId]
        );

        if (driverExistsRes.rows.length === 0) {
          console.warn(`⚠️ No driver entry found for user ${driverId}`);
        } else {
          const vehicleQuery = `
                UPDATE drivers
                SET ${vehicleUpdates.join(", ")}
                WHERE user_id = $${vehicleParamIndex}
             `;
          await client.query(vehicleQuery, vehicleValues);
        }
      }
    }

    await client.query("COMMIT");

    // --- 4. RETURN UPDATED PROFILE ---
    // We reuse getDriverProfile logic logic here manually to ensure consistency
    const updatedProfileQuery = `
      SELECT
        d.user_id, d.full_name, d.email, d.phone, d.role, d.profile_photo_url, d.rating, d.status,
        v.vehicle_model, v.plate_number, v.tow_type, v.tow_capacity,
        v.insurance_doc_url, v.registration_doc_url, v.tow_truck_photo_url
      FROM driver_users d
      LEFT JOIN drivers v ON v.user_id = d.user_id
      WHERE d.user_id = $1
    `;
    const result = await client.query(updatedProfileQuery, [driverId]);
    const driver = result.rows[0];

    const responseData = {
      id: driver.user_id,
      full_name: driver.full_name,
      email: driver.email,
      phone_number: driver.phone,
      role: driver.role,
      profile_photo_url: driver.profile_photo_url,
      rating: driver.rating,
      status: driver.status,
      driver_details: {
        vehicle: {
          model: driver.vehicle_model,
          plate_number: driver.plate_number,
          tow_type: driver.tow_type, // ✅ You fixed this! It is NOT 'color' anymore.
          tow_capacity: driver.tow_capacity,
          insurance_document_url: driver.insurance_doc_url,
          registration_document_url: driver.registration_doc_url,
          tow_truck_photo_url: driver.tow_truck_photo_url, // ✅ You fixed this! It is NOT 'image' anymore.
        },
      },
    };

    res.json({ success: true, user: responseData });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Update Profile Error:", err);
    if (err.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "Phone number or email already in use.",
      });
    }
    res.status(500).json({
      success: false,
      message: "Failed to update profile.",
    });
  } finally {
    client.release();
  }
};

// ==========================================
// 5. ✅ GET DRIVER PROFILE (ADDED THIS FUNCTION)
// ==========================================
// This handles the GET /api/driver/profile request
export const getDriverProfile = async (req, res) => {
  try {
    const driverId = req.user.id;

    // Join driver_users with drivers table to get vehicle details
    const query = `
      SELECT
        d.user_id, d.full_name, d.email, d.phone, d.role, d.profile_photo_url, d.rating, d.status, d.created_at,
        v.vehicle_model, v.plate_number, v.tow_type, v.tow_capacity,
        v.insurance_doc_url, v.registration_doc_url, v.tow_truck_photo_url
      FROM driver_users d
      LEFT JOIN drivers v ON v.user_id = d.user_id
      WHERE d.user_id = $1
    `;

    const result = await pool.query(query, [driverId]);

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const driver = result.rows[0];

    // ✅ CORRECT MAPPING: Map DB columns to Frontend keys
    const responseData = {
      id: driver.user_id,
      full_name: driver.full_name,
      email: driver.email,
      phone_number: driver.phone,
      role: driver.role,
      profile_photo_url: driver.profile_photo_url,
      rating: driver.rating,
      status: driver.status,
      created_at: driver.created_at,
      driver_details: {
        vehicle: {
          model: driver.vehicle_model,
          plate_number: driver.plate_number,
          tow_type: driver.tow_type, // Fixed: Sends 'tow_type' instead of 'color'
          tow_capacity: driver.tow_capacity,
          insurance_document_url: driver.insurance_doc_url,
          registration_document_url: driver.registration_doc_url,
          tow_truck_photo_url: driver.tow_truck_photo_url, // Fixed: Sends correct key instead of 'image'
        },
      },
      // Keep direct vehicle access for compatibility if needed
      vehicle: {
        model: driver.vehicle_model,
        plate_number: driver.plate_number,
        tow_type: driver.tow_type,
        tow_truck_photo_url: driver.tow_truck_photo_url,
      },
    };

    res.status(200).json(responseData);
  } catch (error) {
    console.error("❌ Get Profile Error:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error fetching profile" });
  }
};

// ==========================================
// 6. PASSWORD RESET VERIFICATION
// ==========================================
export const verifyOtpController = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const result = await verifyForgotPasswordOtp(email, otp);
    if (result.success) return res.status(200).json(result);
    return res.status(400).json(result);
  } catch (error) {
    console.error("❌ Verify OTP Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const resetPasswordController = async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    const result = await resetDriverPassword(email, newPassword);
    if (result.success) return res.status(200).json(result);
    return res.status(400).json(result);
  } catch (error) {
    console.error("❌ Reset Password Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
