import express from "express";
import { pool } from "../../config/db.js";

const router = express.Router();

// ==========================================
// 1. DRIVER APP: Updates GPS location
// ==========================================
router.post("/location/update", async (req, res) => {
  try {
    const { driver_id, latitude, longitude, heading, status } = req.body;

    // console.log("📍 Location Update:", { driver_id, latitude, longitude });

    if (!driver_id) return res.status(400).json({ error: "Missing driver_id" });

    // ✅ FIX: Explicitly set updated_at = NOW()
    // This keeps the driver "alive" and prevents them from being filtered out below
    const query = `
      UPDATE driver_users 
      SET 
        latitude = $1, 
        longitude = $2, 
        heading = $3, 
        status = $4,
        updated_at = NOW()  -- ⚡ This is critical: Marks "Last Seen" time
      WHERE user_id = $5
    `;

    await pool.query(query, [latitude, longitude, heading, status, driver_id]);

    res.json({ success: true });
  } catch (err) {
    console.error("🔥 DB Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 2. DRIVER APP: Go Offline (Endpoint)
// ==========================================
router.post("/status", async (req, res) => {
  try {
    const { driver_id, status } = req.body;

    if (!driver_id || !status) {
      return res.status(400).json({ error: "Missing driver_id or status" });
    }

    console.log("🛑 Status Change Received:", { driver_id, status });

    await pool.query("UPDATE driver_users SET status = $1 WHERE user_id = $2", [
      status,
      driver_id,
    ]);

    res.json({ success: true, message: `Driver is now ${status}` });
  } catch (err) {
    console.error("Update Status Error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// ==========================================
// 3. USER APP: Fetch Nearby Drivers (FIXED)
// ==========================================
router.get("/nearby", async (req, res) => {
  try {
    const { lat, lng, radius } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: "Latitude and Longitude required" });
    }

    const searchRadius = radius ? radius / 1000 : 10; // Default 10km

    // ✅ THE "NO DELAY" FIX:
    // We reduced the timeout from '2 minutes' to '10 seconds'.
    // If a driver stops sending heartbeats (app closed/crashed), they disappear in 10s.
    const query = `
      SELECT 
        u.user_id as id, 
        u.full_name, 
        u.profile_photo_url, 
        u.rating, 
        u.price_per_km,
        u.latitude, 
        u.longitude, 
        u.heading,
        u.status,
        d.tow_type
      FROM driver_users u
      LEFT JOIN drivers d ON u.user_id = d.user_id
      WHERE u.status = 'online' 
      AND u.latitude IS NOT NULL 
      AND u.longitude IS NOT NULL
      
      -- ⏰ ZOMBIE KILLER SWITCH: 
      -- Ignore drivers who haven't updated in the last 16.666667 hours.
      AND u.updated_at > NOW() - INTERVAL '60000 seconds'
      
      AND (
        6371 * acos(
          cos(radians($1)) * cos(radians(u.latitude)) * cos(radians(u.longitude) - radians($2)) + 
          sin(radians($3)) * sin(radians(u.latitude))
        )
      ) < $4
    `;

    const result = await pool.query(query, [lat, lng, lat, searchRadius]);

    const formattedDrivers = result.rows.map((d) => ({
      id: d.id,
      full_name: d.full_name,
      avatar: d.profile_photo_url,
      tow_type: d.tow_type || "Standard Tow",
      rating: parseFloat(d.rating) || 5.0,
      price_per_km: parseFloat(d.price_per_km) || 15.0,
      latitude: parseFloat(d.latitude),
      longitude: parseFloat(d.longitude),
      heading: d.heading || 0,
      status: d.status,
    }));

    res.json({ success: true, drivers: formattedDrivers });
  } catch (err) {
    console.error("Nearby fetch error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

export default router;
