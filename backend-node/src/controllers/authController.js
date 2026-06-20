import { supabase } from "../config/supabase.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const { data: existingUser, error: findError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingUser) {
      return res.status(409).json({ message: "User exists" })
    }

    const hashed = await bcrypt.hash(password, 10);

    const { data: user, error: insertError } = await supabase
      .from('users')
      .insert([{
        name,
        email,
        password: hashed
      }])
      .select('id, name, email')
      .single();

    if (insertError) throw insertError;

    res.status(201).json({ 
      message: "User created successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    })
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, password')
      .eq('email', email)
      .maybeSingle();

    if (!user) return res.status(400).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    })
  } catch (error) {
      console.error("Error logging in:", error);
      res.status(500).json({ message: "Internal server error" });
  }
};
