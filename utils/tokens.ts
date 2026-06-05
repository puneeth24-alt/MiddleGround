import { nanoid } from "nanoid";

export function generateShareToken(): string {
  return nanoid(18);
}

export function generateId(): string {
  return crypto.randomUUID();
}
