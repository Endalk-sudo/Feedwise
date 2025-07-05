
import jwt from "jsonwebtoken";
// import { ACCESS_SECRET } from '../config/jwt.js';
import dotenv from "dotenv";
dotenv.config();

const ACCESS_SECRET = process.env.JWT_SECRET_ACCESS;

const verifyToken = (req, res, next) => {
    // Get token from Authorization header (format: 'Bearer TOKEN')
    const authHeader = req.header('Authorization');
    if (!authHeader) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    const token = authHeader.split(' ')[1]; // Extract the token part

    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    try {
        // Verify the token using the secret
        const decoded = jwt.verify(token, ACCESS_SECRET);
        req.user = decoded.user; // Attach user info (id, etc.) to the request
        next(); // Continue to the next middleware or route handler
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ msg: 'Token expired', code: 'TOKEN_EXPIRED' });
        }
        res.status(401).json({ msg: 'Token is not valid' });
    }
};

export default verifyToken;
