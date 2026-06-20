import { supabase } from "../config/supabase.js";

export const getTransactions = async (req, res) => {
  try {
    const userId = req.user?.id || req.query.userId;

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ message: "Failed to fetch transactions" });
  }
};
