import express from "express";
import {
  requestOtp,
  completeProfile,
  login,
  updateDriverProfile,
  // ✅ 1. Import the missing GET profile function from your controller
  getDriverProfile,
} from "../../controllers/driversController/driversauthController.js";
import { pool } from "../../config/db.js";
import verifyToken from "../../middleware/authMiddleware.js";

const router = express.Router();

// ==========================================
// 🔐 AUTH ROUTES
// ==========================================
router.post("/request-otp", requestOtp);
router.post("/complete-profile", completeProfile);
router.post("/login", login);

// ==========================================
// 👤 PROFILE ROUTES
// ==========================================

// ✅ UPDATE PROFILE
router.put("/profile/update", verifyToken, updateDriverProfile);

// ✅ GET PROFILE (CORRECTED)
// We removed the big inline function that was here.
// Now it points directly to your fixed controller function.
router.get("/profile", verifyToken, getDriverProfile);

// ==========================================
// 🚀 LOCATION & MAP ROUTES
// ==========================================

// 1. DRIVER APP: Updates GPS location (Called every 3s when online)
router.post("/location/update", async (req, res) => {
  try {
    const { driver_id, latitude, longitude, heading, status } = req.body;

    const query = `
      UPDATE driver_users 
      SET latitude = $1, longitude = $2, heading = $3, status = $4, updated_at = NOW() 
      WHERE user_id = $5
    `;

    await pool.query(query, [latitude, longitude, heading, status, driver_id]);

    res.json({ success: true });
  } catch (err) {
    console.error("Location update error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// 2. DRIVER APP: Go Offline (Called when pressing STOP)
router.post("/status", async (req, res) => {
  try {
    const { driver_id, status } = req.body;

    await pool.query("UPDATE driver_users SET status = $1 WHERE user_id = $2", [
      status,
      driver_id,
    ]);

    res.json({ success: true });
  } catch (err) {
    console.error("Status update error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// 3. USER APP: Fetch Nearby Drivers (Called by ActivityScreen map)
router.get("/nearby", async (req, res) => {
  try {
    const { lat, lng, radius } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: "Latitude and Longitude required" });
    }

    const searchRadius = radius ? radius / 1000 : 10; // Default 10km

    // Haversine Formula for Postgres
    const query = `
      SELECT 
        user_id as id, 
        full_name as first_name, 
        '' as last_name, 
        profile_photo_url, 
        'Tow Truck' as vehicle_type, 
        latitude, 
        longitude, 
        heading 
      FROM driver_users 
      WHERE status = 'online' 
      AND latitude IS NOT NULL 
      AND longitude IS NOT NULL
      AND (
        6371 * acos(
          cos(radians($1)) * cos(radians(latitude)) * cos(radians(longitude) - radians($2)) + 
          sin(radians($3)) * sin(radians(latitude))
        )
      ) < $4
    `;

    const result = await pool.query(query, [lat, lng, lat, searchRadius]);

    // Format for React Native
    const formattedDrivers = result.rows.map((d) => ({
      id: d.id,
      latitude: parseFloat(d.latitude),
      longitude: parseFloat(d.longitude),
      heading: d.heading || 0,
      status: "online",
      vehicleType: d.vehicle_type || "Tow Truck",
      avatar: d.profile_photo_url,
    }));

    res.json({ success: true, drivers: formattedDrivers });
  } catch (err) {
    console.error("Nearby fetch error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

export default router;
