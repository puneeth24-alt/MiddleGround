import type { User } from "next-auth";
import { supabase } from "@/lib/supabase/client";
import type { UserRecord } from "@/types/store";
import bcrypt from "bcryptjs";

export class AuthService {
  static async authenticate(emailInput?: string, passwordInput?: string): Promise<UserRecord | null> {
    try {
      const email = emailInput?.trim().toLowerCase();
      const password = passwordInput?.trim();

      if (!email || !password || !email.includes("@")) {
        console.warn("[AuthService] Invalid email or password provided");
        return null;
      }

      const { data: user, error } = await supabase
        .from("users")
        .select("*")
        .eq("email", email)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // User not found - this is expected
          console.warn("[AuthService] User not found:", email);
          return null;
        }
        throw new Error(`Database error: ${error.message}`);
      }

      if (!user) {
        console.warn("[AuthService] User record is empty:", email);
        return null;
      }

      if (!user.password) {
        console.warn("[AuthService] User has no password (OAuth user?):", email);
        return null;
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        console.warn("[AuthService] Invalid password for:", email);
        return null;
      }

      console.log("[AuthService] User authenticated successfully:", email);

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        createdAt: user.created_at
      };
    } catch (error) {
      console.error("[AuthService] Authentication error:", error);
      return null;
    }
  }

  static async register(input: { email: string; name: string; password: string }): Promise<UserRecord> {
    const email = input.email.trim().toLowerCase();
    
    if (!email || !email.includes("@")) {
      throw new Error("Invalid email address");
    }
    if (input.password.length < 6) {
      throw new Error("Password must be at least 6 characters long");
    }

    // Check if email exists
    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existing) {
      throw new Error("Email is already registered");
    }

    const hashedPassword = await bcrypt.hash(input.password, 10);
    
    const { data: user, error } = await supabase
      .from("users")
      .insert({
        name: input.name.trim(),
        email,
        password: hashedPassword
      })
      .select("*")
      .single();

    if (error || !user) {
      throw new Error(error?.message || "Could not register user");
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      createdAt: user.created_at
    };
  }

  static async upsertFromProfile(user: User): Promise<UserRecord | null> {
    if (!user.email) {
      console.error("[AuthService] User object missing email", user);
      return null;
    }

    const email = user.email.toLowerCase();

    try {
      const { data: existing, error: selectError } = await supabase
        .from("users")
        .select("*")
        .eq("email", email)
        .maybeSingle();

      if (selectError) {
        throw new Error(`Failed to fetch user: ${selectError.message}`);
      }

      if (existing) {
        // Update name/image if needed
        const { data: updated, error } = await supabase
          .from("users")
          .update({
            name: user.name || existing.name,
            image: user.image || existing.image
          })
          .eq("id", existing.id)
          .select("*")
          .single();
          
        if (error || !updated) throw new Error(error?.message || "Could not update user");
        
        return {
          id: updated.id,
          name: updated.name,
          email: updated.email,
          image: updated.image,
          createdAt: updated.created_at
        };
      }

      // Insert new user (OAuth users don't have password)
      const { data: inserted, error } = await supabase
        .from("users")
        .insert({
          email,
          name: user.name || "User",
          image: user.image,
          password: null  // OAuth users don't have passwords
        })
        .select("*")
        .single();

      if (error || !inserted) throw new Error(error?.message || "Could not create user");

      return {
        id: inserted.id,
        name: inserted.name,
        email: inserted.email,
        image: inserted.image,
        createdAt: inserted.created_at
      };
    } catch (error) {
      console.error("[AuthService] upsertFromProfile error:", error);
      throw error;
    }
  }
}
