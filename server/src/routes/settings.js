import express from "express"
import { verifyToken } from "../middleware/auth.js";
import { updateOrganizationSettings, getOrganizationSettings } from "../controllers/settingsController.js";
import {requireSubscription} from "../middleware/authorize.js";
import multer from "multer";

const router = express.Router();

router.use(verifyToken);
router.use(requireSubscription);

// --- Multer Configuration for In-Memory Storage ---
const update = multer({storage: multer.memoryStorage()})

// GET /settings - Get current organization settings
router.get("/", getOrganizationSettings);

// PUT /settings - Update organization settings
router.put("/", update.single('logo'), updateOrganizationSettings);

export default router;