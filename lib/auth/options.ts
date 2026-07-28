import type { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import { AuthService } from "@/services/AuthService";
import { env } from "@/lib/env";

const providers: AuthOptions["providers"] = [
  CredentialsProvider({
    name: "Email",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" }
    },
    async authorize(credentials) {
      try {
        if (!credentials?.email || !credentials?.password) {
          console.error("[CredentialsProvider] Missing email or password");
          return null;
        }

        const user = await AuthService.authenticate(
          credentials.email,
          credentials.password
        );

        if (!user) {
          console.warn("[CredentialsProvider] Authentication failed for email:", credentials.email);
          return null;
        }

        console.log("[CredentialsProvider] User authenticated:", user.email);

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image
        };
      } catch (error) {
        console.error("[CredentialsProvider] Authorization error:", error);
        return null;
      }
    }
  })
];

if (env.AUTH_GITHUB_ID && env.AUTH_GITHUB_SECRET) {
  providers.push(
    GitHubProvider({
      clientId: env.AUTH_GITHUB_ID,
      clientSecret: env.AUTH_GITHUB_SECRET
    })
  );
}

if (env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: env.AUTH_GOOGLE_ID,
      clientSecret: env.AUTH_GOOGLE_SECRET
    })
  );
}

export const authOptions: AuthOptions = {
  providers,
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/login"
  },
  secret: env.NEXTAUTH_SECRET ?? "middleground-local-development-secret",
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        try {
          const localUser = await AuthService.upsertFromProfile(user);
          token.id = localUser?.id ?? user.id;
        } catch (error) {
          console.error("[NextAuth] JWT callback error:", error);
          throw new Error(`JWT callback failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.id ?? token.sub ?? "");
      }

      return session;
    }
  },
  events: {
    async signIn({ user, account, isNewUser }) {
      console.log("[NextAuth] User signed in:", { email: user.email, provider: account?.provider, isNewUser });
    }
  }
};
