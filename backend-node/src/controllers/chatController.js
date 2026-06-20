import { supabase } from "../config/supabase.js";
import { TABLE_NAME as ConversationTable } from "../models/Conversations.js";
import { TABLE_NAME as TransactionTable } from "../models/Transactions.js";
import { embedText } from "../utils/embedService.js";
import { generateAIResponse } from "../utils/aiService.js";
import { retrieveRelevantTransactions } from "../utils/retrieveContext.js";
import { buildFinancialSummary } from "../utils/financialSummary.js";
import { detectTemporalIntent } from "../utils/intentDetector.js";

export const chatWithAI = async (req, res) => {
  const userId = req.user?.id || req.body.userId;
  const { message, conversationId } = req.body;

  if (!userId || !message) {
    return res.status(400).json({ error: "User ID and message are required" });
  }

  // ───────── SSE HEADERS ─────────
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  try {
    let conversation;

    // ───────── LOAD OR CREATE CONVERSATION ─────────
    if (conversationId) {
      const { data: convData, error: convError } = await supabase
        .from(ConversationTable)
        .select('*')
        .eq('id', conversationId)
        .eq('user_id', userId)
        .single();

      if (convError || !convData) {
        res.write(`data: ${JSON.stringify({ error: "Conversation not found" })}\n\n`);
        return res.end();
      }
      conversation = convData;
    } else {
      const { data: newConv, error: createError } = await supabase
        .from(ConversationTable)
        .insert({
          user_id: userId,
          title: message.substring(0, 25),
          messages: [],
        })
        .select()
        .single();

      if (createError) throw createError;
      conversation = newConv;
    }

    // Get recent history BEFORE pushing current user message
    const recentHistory = (conversation.messages || []).slice(-4);

    // Prepare updated messages
    const updatedMessages = [
      ...(conversation.messages || []),
      {
        role: "user",
        content: message,
        timestamp: new Date().toISOString(),
      }
    ];

    // ───────── INTENT DETECTION ─────────
    const temporalIntent = detectTemporalIntent(message);

    let relevantTransactions;
    let summary;

    if (temporalIntent.isTemporal) {
      // Temporal query — bypass Qdrant, use date-sorted Supabase results
      const order = temporalIntent.order === "asc" ? false : true; // false for asc (default), true for desc

      const [temporalTxnsResult, allTransactionsResult] = await Promise.all([
        supabase
          .from(TransactionTable)
          .select('*')
          .eq('user_id', userId)
          .order('timestamp', { ascending: !order })
          .limit(temporalIntent.count),
        supabase
          .from(TransactionTable)
          .select('*')
          .eq('user_id', userId)
          .order('timestamp', { ascending: false })
          .limit(100),
      ]);

      if (temporalTxnsResult.error) throw temporalTxnsResult.error;
      if (allTransactionsResult.error) throw allTransactionsResult.error;

      relevantTransactions = temporalTxnsResult.data.map((tx) => ({
        ...tx,
        relevanceScore: 1.0,
      }));
      summary = buildFinancialSummary(allTransactionsResult.data);
    } else {
      // ───────── RAG PIPELINE (parallelized) ─────────
      const [queryEmbedding, allTransactionsResult] = await Promise.all([
        embedText(message),
        supabase
          .from(TransactionTable)
          .select('*')
          .eq('user_id', userId)
          .order('timestamp', { ascending: false })
          .limit(100),
      ]);

      if (allTransactionsResult.error) throw allTransactionsResult.error;

      [relevantTransactions, summary] = await Promise.all([
        retrieveRelevantTransactions(userId, queryEmbedding),
        Promise.resolve(buildFinancialSummary(allTransactionsResult.data)),
      ]);
    }

    // Send conversationId early to frontend
    res.write(
      `data: ${JSON.stringify({ conversationId: conversation.id })}\n\n`
    );

    // ───────── STREAM AI RESPONSE ─────────
    const aiResponse = await generateAIResponse(relevantTransactions, message, summary, res, recentHistory);

    // Save assistant message after streaming completes
    const finalMessages = [
      ...updatedMessages,
      {
        role: "assistant",
        content: aiResponse,
        timestamp: new Date().toISOString(),
      }
    ];

    const { error: updateError } = await supabase
      .from(ConversationTable)
      .update({ messages: finalMessages })
      .eq('id', conversation.id);
      
    if (updateError) throw updateError;

    res.write(`data: ${JSON.stringify({ saved: true })}\n\n`);
  } catch (error) {
    console.error("Error in chatWithAI:", error);
    if (!res.writableEnded) {
      res.write(
        `data: ${JSON.stringify({ error: "Failed to process chat message" })}\n\n`
      );
    }
  } finally {
    if (!res.writableEnded) {
      res.end();
    }
  }
};