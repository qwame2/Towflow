import express from "express";
// ✅ FIX 1: Go up TWO levels to reach 'src', then into 'controllers'
import {
  addVehicle,
  getVehicles,
  deleteVehicle,
  updateVehicle,
} from "../../controllers/usersController/vehicleController.js";

// ✅ FIX 2: Go up TWO levels to reach 'src', then into 'middleware'
import authMiddleware from "../../middleware/authMiddleware.js";

const router = express.Router();

// GET all vehicles (Protected)
router.get("/", authMiddleware, getVehicles);

// POST add new vehicle (Protected)
router.post("/add", authMiddleware, addVehicle);

// DELETE a vehicle by ID (Protected)
router.delete("/:id", authMiddleware, deleteVehicle);

// UPDATE a vehicle by ID (Protected)
router.put("/:id", authMiddleware, updateVehicle);

export default router;
