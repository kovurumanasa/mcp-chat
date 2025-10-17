import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";

// Initialize better-sqlite3 database
const sqlite = new Database(process.env.DATABASE_URL?.replace("sqlite://", "") || "./dev.db");

// Initialize Drizzle with better-sqlite3 and schema
export const db = drizzle(sqlite, { schema });