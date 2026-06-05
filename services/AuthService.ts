import type { User } from "next-auth";
import { FileStore } from "@/lib/store/file-store";
import type { UserRecord } from "@/types/store";

export class AuthService {
  static async upsertFromCredentials(input: { email?: string; name?: string }): Promise<UserRecord | null> {
    const email = input.email?.trim().toLowerCase();

    if (!email || !email.includes("@")) {
      return null;
    }

    return FileStore.upsertUser({
      email,
      name: input.name?.trim() || email.split("@")[0]
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
