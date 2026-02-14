import express from "express";
import { chatWithAI } from "../controllers/chatController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", chatWithAI);

export default router;
