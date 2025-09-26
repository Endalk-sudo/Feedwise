import express from "express";
import getAIResponse from "../controllers/aiController.js";
import {verifyToken} from "../middleware/auth.js";
import { requireProPlan } from "../middleware/authorize.js";

const router = express.Router();


router.post("/",verifyToken, requireProPlan, getAIResponse);


export default router