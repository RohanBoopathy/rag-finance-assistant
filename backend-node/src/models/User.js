import { supabase } from "../config/supabase.js";

/**
 * Thin data-access layer for the `users` table.
 * Mirrors the handful of Mongoose calls authController.js used to make,
 * so the controller logic itself barely has to change.
 */

export const findUserByEmail = async (email) => {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .maybeSingle();

  if (error) throw error;
  return data; // null if not found
};

export const createUser = async ({ name, email, password }) => {
  const { data, error } = await supabase
    .from("users")
    .insert({ name, email, password })
    .select()
    .single();

  if (error) throw error;
  return data;
};