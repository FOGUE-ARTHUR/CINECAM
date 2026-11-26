// Initialisation de la base de données SQLite
import { mockDB } from "./mock-db";

let initialized = false;

export async function initializeDatabase() {
  if (initialized) return;
  try {
    await mockDB.init();
    initialized = true;
    console.log("[DB] SQLite database initialized");
  } catch (error) {
    console.error("[DB] Failed to initialize database", error);
  }
}

export function isDatabaseReady() {
  return initialized;
}
