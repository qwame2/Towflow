import { pool } from "../../config/db.js";

export const completeProfile = async (req, res) => {
  const { email, fullName, username, phone, profilePicture } = req.body;

  try {
    const updatedUser = await pool.query(
      `
      UPDATE users 
      SET full_name=$1, username=$2, phone=$3, profile_picture=$4, updated_at=NOW()
      WHERE email=$5
      RETURNING *
      `,
      [fullName, username, phone, profilePicture, email]
    );

    res.json({ message: "Profile completed", user: updatedUser.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating profile" });
  }
};
