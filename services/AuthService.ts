import type { User } from "next-auth";
import { FileStore } from "@/lib/store/file-store";
import type { UserRecord } from "@/types/store";
import bcrypt from "bcryptjs";

export class AuthService {
  static async authenticate(emailInput?: string, passwordInput?: string): Promise<UserRecord | null> {
    const email = emailInput?.trim().toLowerCase();
    const password = passwordInput?.trim();

    if (!email || !password || !email.includes("@")) {
      return null;
    }

    const store = await FileStore.read();
    const user = store.users.find((u) => u.email === email);
    
    if (!user || !user.password) {
      return null;
    }

    const isValid = await bcrypt.compare(password, user.password);
    return isValid ? user : null;
  }

  static async register(input: { email: string; name: string; password: string }): Promise<UserRecord> {
    const email = input.email.trim().toLowerCase();
    
    if (!email || !email.includes("@")) {
      throw new Error("Invalid email address");
    }
    if (input.password.length < 6) {
      throw new Error("Password must be at least 6 characters long");
    }

    const store = await FileStore.read();
    if (store.users.some(u => u.email === email)) {
      throw new Error("Email is already registered");
    }

    const hashedPassword = await bcrypt.hash(input.password, 10);
    return FileStore.upsertUser({
      email,
      name: input.name.trim(),
      password: hashedPassword
    });
  }

  static async upsertFromProfile(user: User): Promise<UserRecord | null> {
    if (!user.email) {
      return null;
    }

    return FileStore.upsertUser({
      email: user.email,
      name: user.name,
      image: user.image
    });
  }
}
