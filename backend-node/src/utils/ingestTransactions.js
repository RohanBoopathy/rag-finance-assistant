import { updateTransactionEmbedding } from "../models/Transactions.js";
import { embedText } from "./embedService.js";

/**
 * Embeds a single transaction's text and stores the vector directly on
 * the transaction row (transactions.embedding column), replacing the old
 * Qdrant upsert + mongoId cross-reference dance.
 */
export const ingestTransaction = async (tx) => {
  try {
    const text = `${tx.type === "credit" ? "Credit" : "Debit"} of ${Number(
      tx.amount
    ).toFixed(2)} at ${tx.merchant || "Unknown"} (category: ${
      tx.category || "Uncategorized"
    }) on ${new Date(tx.timestamp).toISOString().split("T")[0]}. Suspicious: ${
      tx.isSuspicious
    }`;

    const vector = await embedText(text);

    await updateTransactionEmbedding(tx._id, vector);

    console.log(`Ingested transaction ${tx._id}`);
  } catch (e) {
    console.error(`Error ingesting transaction ${tx._id}:`, e.message);
    throw e;
  }
};