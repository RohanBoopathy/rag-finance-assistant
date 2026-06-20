export const TABLE_NAME = 'transactions';

import { supabase } from "../config/supabase.js";

/**
 * Thin data-access layer for the `transactions` table.
 * Field names are mapped snake_case (Postgres) <-> camelCase (app code)
 * here, at the boundary, so the rest of the app keeps using the same
 * shape it always has (amount, merchant, isSuspicious, timestamp, ...).
 */

const fromRow = (row) =>
  row && {
    _id: row.id,
    userId: row.user_id,
    amount: Number(row.amount),
    category: row.category,
    merchant: row.merchant,
    name: row.name,
    type: row.type,
    isSuspicious: row.is_suspicious,
    timestamp: row.timestamp,
  };

export const findTransactionsByUser = async (
  userId,
  { sort = "desc", limit = 100 } = {}
) => {
  const { data, error } = await supabase
    .from("transactions")
    .select("id, user_id, amount, category, merchant, name, type, is_suspicious, timestamp")
    .eq("user_id", userId)
    .order("timestamp", { ascending: sort === "asc" })
    .limit(limit);

  if (error) throw error;
  return data.map(fromRow);
};

export const getAllTransactionsForIngest = async () => {
  const { data, error } = await supabase
    .from("transactions")
    .select("id, user_id, amount, category, merchant, name, type, is_suspicious, timestamp, embedding");

  if (error) throw error;
  return data.map((row) => ({ ...fromRow(row), embedding: row.embedding }));
};

export const updateTransactionEmbedding = async (id, embedding) => {
  const { error } = await supabase
    .from("transactions")
    .update({ embedding })
    .eq("id", id);

  if (error) throw error;
};