import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 🔍 DEBUG LOG: See what is actually inside the token
    console.log("🔑 Decoded Token Payload:", decoded); 

    req.user = decoded;
    next();
  } catch (error) {
    console.log("Token verification failed:", error.message);
    return res.status(403).json({ success: false, message: "Invalid token" });
  }
};

export default authMiddleware;