import mongoose from "mongoose";
import Transaction from "../models/Transactions.js";
import { buildFinancialSummary } from "../utils/financialSummary.js";
import { generateAIResponse } from "../utils/aiService.js";

export const chatWithAI = async (req, res) => {
  const userId = req.user?.id || req.body.userId; // fallback for prototype

//   const transactions = await Transaction.find({ userId });
console.log("User ID received:", userId);

const transactions = await Transaction.find({
  userId: new mongoose.Types.ObjectId(userId),
});

console.log("Transactions found:", transactions);
  const summary = buildFinancialSummary(transactions);

  const aiReply = await generateAIResponse(
    summary,
    req.body.message
  );

  res.json({ reply: aiReply });
};
