import express from "express"
import { verifyToken } from "../middleware/auth.js";
import { updateOrganizationSettings, getOrganizationSettings } from "../controllers/settingsController.js";
import multer from "multer";

const router = express.Router();

// --- Multer Configuration for In-Memory Storage ---
const update = multer({storage: multer.memoryStorage()})

// GET /settings - Get current organization settings
router.get("/", verifyToken, getOrganizationSettings);

// PUT /settings - Update organization settings
router.put("/", verifyToken, update.single('logo'), updateOrganizationSettings);

export default router;