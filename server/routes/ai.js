import express from "express";
import getAIResponse from "../controllers/aiController.js";
import {verifyToken} from "../middleware/auth.js";

const router = express.Router();


router.post("/",verifyToken, getAIResponse);


export default router