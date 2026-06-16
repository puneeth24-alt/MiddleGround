import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type { AppStore, UserRecord } from "@/types/store";

const DATA_DIR = path.join(process.cwd(), ".middleground-data");
const DATA_FILE = path.join(DATA_DIR, "store.json");

let writeQueue: Promise<void> = Promise.resolve();

function emptyStore(): AppStore {
  return {
    users: [],
    plans: [],
    participants: [],
    locations: []
  };
}

export class FileStore {
  static async read(): Promise<AppStore> {
    try {
      const raw = await readFile(DATA_FILE, "utf8");
      return JSON.parse(raw) as AppStore;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return emptyStore();
      }

      throw error;
    }
  }

  static async write(store: AppStore): Promise<void> {
    await mkdir(DATA_DIR, { recursive: true });
    const tempFile = `${DATA_FILE}.tmp`;
    await writeFile(tempFile, JSON.stringify(store, null, 2), "utf8");
    await rename(tempFile, DATA_FILE);
  }

  static async update<T>(mutator: (store: AppStore) => T | Promise<T>): Promise<T> {
    let result: T | undefined;

    const next = writeQueue.then(async () => {
      const store = await FileStore.read();
      result = await mutator(store);
      await FileStore.write(store);
    });

    writeQueue = next.catch(() => undefined);
    await next;

    return result as T;
  }

  static async upsertUser(input: { email: string; name?: string | null; image?: string | null; password?: string }): Promise<UserRecord> {
    const email = input.email.trim().toLowerCase();

    return FileStore.update((store) => {
      const existing = store.users.find((user) => user.email === email);
      if (existing) {
        existing.name = input.name ?? existing.name;
        existing.image = input.image ?? existing.image;
        if (input.password !== undefined) {
          existing.password = input.password;
        }
        return existing;
      }

      const now = new Date().toISOString();
      const user: UserRecord = {
        id: crypto.randomUUID(),
        email,
        name: input.name ?? email.split("@")[0],
        image: input.image ?? null,
        password: input.password,
        createdAt: now
      };

      store.users.push(user);
      return user;
    });
  }
}
