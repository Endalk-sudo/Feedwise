import jwt from "jsonwebtoken";

// This is like a security guard at the door
// It checks if you have a valid key card (JWT token) before letting you in

export const authenticateToken = (req, res, next) => {
  // Get the token from the Authorization header
  // Expected format: "Bearer your-token-here"
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Get the part after "Bearer"

  // If no token provided, deny access
  if (!token) {
    return res.status(401).json({ message: "Access token required" });
  }

  // Verify the token is valid and not expired
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      // Token is invalid or expired
      return res.status(403).json({ message: "Invalid or expired token" });
    }

    // Token is valid - add organization info to the request
    // This is like stamping your hand at a concert - now everyone knows you're allowed in
    req.organizationId = decoded.organizationId;
    
    // Continue to the next step (the actual route handler)
    next();
  });
};
