import express from "express";
import { supabase } from "../config/supabase.js";
import { TABLE_NAME } from "../models/Transactions.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// GET /api/transactions — returns all transactions for the authenticated user
router.get("/", protect, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from(TABLE_NAME)
            .select("*")
            .eq("user_id", req.user.id)
            .order("timestamp", { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (err) {
        console.error("Error fetching transactions:", err);
        res.status(500).json({ error: "Failed to fetch transactions" });
    }
});

export default router;
