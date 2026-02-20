import mongoose from "mongoose";
import Conversation from "../models/Conversations.js";
import Transaction from "../models/Transactions.js";
import { buildFinancialSummary } from "../utils/financialSummary.js";
import { generateAIResponse } from "../utils/aiService.js";

export const chatWithAI = async (req, res) => {
  const userId = req.user?.id || req.body.userId; // fallback for prototype
  const { message, conversationId } = req.body;

  try {
    let conversation;
    if (conversationId) {
      conversation = await Conversation.findOne({
        _id: conversationId,
        userId: new mongoose.Types.ObjectId(userId)
      })

      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found or inaccessible" });
      }
    } else {
        conversation = new Conversation({
          userId: new mongoose.Types.ObjectId(userId),
          title: message.substring(0, 20) + "...",
          messages: [],
        })
    }

    // Add user message to conversation
    conversation.messages.push({
      role: 'user',
      content: message,
      timestamp: new Date()
    })

    const transactions = await Transaction.find({
      userId: new mongoose.Types.ObjectId(userId),
    })

    const summary = buildFinancialSummary(transactions);
    const aiResponse = await generateAIResponse(summary, message)

    conversation.messages.push({
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date()
    })

    await conversation.save();

    res.json({ 
      reply: aiResponse,
      conversationId: conversation._id  
    });
  }  catch (e) {
    console.error("Error in chatWithAi: ", e);
    res.status(500).json({ error: "Failed to process chat message" });
  }
};
