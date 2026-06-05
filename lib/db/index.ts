import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/lib/env";
import * as schema from "@/lib/db/schema";

const url = env.DATABASE_URL ?? "postgresql://user:pass@localhost:5432/middleground";
const client = postgres(url, { prepare: false });

export const db = drizzle(client, { schema });
