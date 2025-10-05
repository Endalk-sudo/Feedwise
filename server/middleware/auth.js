// middleware/verifyToken.js
import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  // Check for "Authorization" header
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    return res.status(401).json({ message: "No token provided" });
  }
  // Extract token: "Bearer TOKEN"
  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Invalid token format" });
  }
  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET_ACCESS);
    // Attach user payload to request (so routes can access req.user)
    req.user = decoded.user;
    next(); // proceed to the route
  } catch (err) {
    console.error('Token verification error:', err);
    return res.status(401).json({ message: "Token is invalid or expired" });
  }
};