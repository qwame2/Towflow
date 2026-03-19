import { pool } from "../../config/db.js";

// --- HELPER: Extract User ID safely ---
const getUserId = (req) => {
  // Checks for .id, .userId, or .sub inside the decoded token
  return req.user.id || req.user.userId || req.user.sub;
};

export const deleteVehicle = async (req, res) => {
  const user_id = req.user.id || req.user.userId || req.user.sub;
  const { id } = req.params; // Vehicle ID from URL

  try {
    // Check if vehicle exists and belongs to user
    const checkQuery =
      "SELECT * FROM user_vehicles WHERE id = $1 AND user_id = $2";
    const checkResult = await pool.query(checkQuery, [id, user_id]);

    if (checkResult.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Vehicle not found or unauthorized" });
    }

    // Delete
    const deleteQuery = "DELETE FROM user_vehicles WHERE id = $1 RETURNING *";
    await pool.query(deleteQuery, [id]);

    res.json({ success: true, message: "Vehicle deleted successfully" });
  } catch (error) {
    console.error("Error deleting vehicle:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// --- 4. UPDATE VEHICLE ---
export const updateVehicle = async (req, res) => {
  const user_id = req.user.id || req.user.userId || req.user.sub;
  const { id } = req.params;
  const {
    make,
    model,
    year,
    color,
    plate,
    fuel_type,
    transmission,
    engine_capacity,
  } = req.body;

  try {
    // Construct dynamic update query
    // We update image_url only if make/model/color changes to keep it fresh
    // But for simplicity here, we keep the old image unless you want to regenerate it.

    const query = `
      UPDATE user_vehicles 
      SET make = $1, model = $2, year = $3, color = $4, plate = $5, 
          fuel_type = $6, transmission = $7, engine_capacity = $8
      WHERE id = $9 AND user_id = $10
      RETURNING *;
    `;

    const values = [
      make,
      model,
      year,
      color,
      plate,
      fuel_type,
      transmission,
      engine_capacity,
      id,
      user_id,
    ];

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Vehicle not found or unauthorized" });
    }

    res.json({
      success: true,
      message: "Vehicle updated",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error updating vehicle:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// --- 1. GET VEHICLES ---
export const getVehicles = async (req, res) => {
  try {
    const user_id = getUserId(req);

    console.log(`🔍 FETCHING: Requesting vehicles for User ID: ${user_id}`);

    if (!user_id) {
      return res
        .status(400)
        .json({ success: false, message: "User ID not found in token" });
    }

    // Ensure table name matches your database (user_vehicless vs user_vehicles)
    const query =
      "SELECT * FROM user_vehicles WHERE user_id = $1 ORDER BY id DESC";

    const result = await pool.query(query, [user_id]);

    console.log(
      `✅ FOUND: ${result.rows.length} vehicles for User ID: ${user_id}`
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("❌ Error fetching vehicles:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// --- 2. ADD VEHICLE ---
export const addVehicle = async (req, res) => {
  const user_id = getUserId(req);
  console.log(`📝 ADDING: Attempting to add vehicle for User ID: ${user_id}`);

  if (!user_id) {
    return res
      .status(400)
      .json({ success: false, message: "User ID not found in token" });
  }

  const {
    make,
    model,
    year,
    color,
    plate,
    vehicle_type,
    fuel_type,
    transmission,
    tire_type,
    engine_capacity,
  } = req.body;

  if (!make || !model || !vehicle_type) {
    return res
      .status(400)
      .json({ success: false, message: "Missing required fields" });
  }

  // --- IMAGE LOGIC ---
  const cleanModel = model.split(" ")[0];
  const image_url = `https://cdn.imagin.studio/getimage?customer=hrjavascript-mastery&make=${make}&modelFamily=${cleanModel}&modelYear=${year}&paintDescription=${color}&angle=01&fileType=png&zoomType=fullscreen&width=800`;

  try {
    const query = `
      INSERT INTO user_vehicles (
        user_id, make, model, year, color, plate, 
        vehicle_type, fuel_type, transmission, tire_type, engine_capacity, 
        image_url
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
      RETURNING *;
    `;

    const values = [
      user_id,
      make,
      model,
      year || new Date().getFullYear().toString(),
      color || "Unknown",
      plate || "Pending",
      vehicle_type,
      fuel_type,
      transmission,
      tire_type,
      engine_capacity,
      image_url,
    ];

    const newVehicle = await pool.query(query, values);

    console.log(
      `✅ SAVED: Vehicle ID ${newVehicle.rows[0].id} saved for User ID ${user_id}`
    );

    res.status(201).json({
      success: true,
      message: "Vehicle added successfully",
      data: newVehicle.rows[0],
    });
  } catch (error) {
    console.error("❌ Error adding vehicle:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
