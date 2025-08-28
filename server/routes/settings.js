import express from "express"
import { verifyToken } from "../middleware/auth.js";
import { updateOrganizationSettings, getOrganizationSettings } from "../controllers/settingsController.js";

const router = express.Router();

// GET /settings - Get current organization settings
router.get("/", verifyToken, getOrganizationSettings);

// PUT /settings - Update organization settings
router.put("/", verifyToken, updateOrganizationSettings);

export default router;