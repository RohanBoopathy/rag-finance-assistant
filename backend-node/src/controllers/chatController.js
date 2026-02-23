import mongoose from "mongoose";
import Conversation from "../models/Conversations.js";
import Transaction from "../models/Transactions.js";
import { embedText } from "../utils/embedService.js";
import { generateAIResponse } from "../utils/aiService.js";
import { retrieveRelevantTransactions } from "../utils/retrieveContext.js";
import { buildFinancialSummary } from "../utils/financialSummary.js";

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

    // ---------- RAG PIPELINE -----------------------

    const queryEmmbedding = await embedText(message);

    const relevantTransactions = await retrieveRelevantTransactions( userId, queryEmmbedding );

    const allTransactions = await Transaction.find({ userId });
    const summary = buildFinancialSummary(allTransactions);

    const aiResponse = await generateAIResponse(relevantTransactions, message, summary);

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
