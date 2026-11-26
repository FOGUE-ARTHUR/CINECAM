/**
 * Authentification locale sécurisée (PBKDF2-SHA256, protection anti brute-force,
 * validation stricte des entrées et session bornée dans sessionStorage).
 *
 * Note d'architecture : pour une mise en production multi-utilisateurs,
 * remplacer par une authentification côté serveur avec cookies HttpOnly.
 */
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { mockDB } from "./mock-db";
import {
  hashPassword,
  isValidEmail,
  normalizeEmail,
  randomId,
  sanitizeText,
  validatePasswordStrength,
  verifyPassword,
} from "./security";

// ─── Types publics ────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
    phone?: string;
  };
}

export interface Session {
  user: User;
  access_token: string;
  expires_at: number;
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, metadata?: User["user_metadata"]) => Promise<void>;
}

// ─── Constantes de sécurité ───────────────────────────────────────────────────

const USERS_KEY = "cinecam_users";
const SESSION_KEY = "cinecam_session";
const ATTEMPTS_KEY = "cinecam_auth_attempts";
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 heures
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MS = 60 * 1000; // 60 secondes

// Email optionnel configuré via variable d'env pour promouvoir le premier compte admin
const BOOTSTRAP_ADMIN_EMAIL =
  typeof import.meta !== "undefined" && typeof import.meta.env?.VITE_ADMIN_EMAIL === "string"
    ? normalizeEmail(import.meta.env.VITE_ADMIN_EMAIL)
    : "";

// ─── Helpers internes ─────────────────────────────────────────────────────────

interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  disabled?: boolean;
  user_metadata?: User["user_metadata"];
}

interface AttemptRecord {
  count: number;
  lockedUntil: number;
}

function hasLocalStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function hasSessionStorage(): boolean {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

function getUsers(): Record<string, UserRecord> {
  if (!hasLocalStorage()) return {};
  try {
    const raw = window.localStorage.getItem(USERS_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const safeUsers: Record<string, UserRecord> = {};
    for (const [key, val] of Object.entries(parsed)) {
      if (key === "__proto__" || key === "constructor" || key === "prototype") continue;
      if (
        val &&
        typeof val === "object" &&
        typeof (val as UserRecord).id === "string" &&
        typeof (val as UserRecord).email === "string" &&
        typeof (val as UserRecord).passwordHash === "string" &&
        (val as UserRecord).passwordHash.startsWith("pbkdf2$")
      ) {
        safeUsers[key] = val as UserRecord;
      }
    }
    return safeUsers;
  } catch {
    return {};
  }
}

function saveUsers(users: Record<string, UserRecord>): void {
  if (!hasLocalStorage()) return;
  window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getStoredSession(): Session | null {
  if (!hasSessionStorage()) return null;
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const sess = JSON.parse(raw) as Partial<Session>;
    if (
      !sess ||
      typeof sess.access_token !== "string" ||
      typeof sess.expires_at !== "number" ||
      !sess.user ||
      typeof sess.user.id !== "string" ||
      typeof sess.user.email !== "string"
    ) {
      window.sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
    if (sess.expires_at <= Date.now()) {
      window.sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
    return sess as Session;
  } catch {
    return null;
  }
}

function saveSession(sess: Session | null): void {
  if (!hasSessionStorage()) return;
  if (sess) {
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(sess));
  } else {
    window.sessionStorage.removeItem(SESSION_KEY);
  }
}

function getAttempts(): Record<string, AttemptRecord> {
  if (!hasSessionStorage()) return {};
  try {
    const raw = window.sessionStorage.getItem(ATTEMPTS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, AttemptRecord>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function checkRateLimit(email: string): void {
  const attempts = getAttempts();
  const entry = attempts[email];
  if (entry && entry.lockedUntil > Date.now()) {
    const seconds = Math.ceil((entry.lockedUntil - Date.now()) / 1000);
    throw new Error(`Trop de tentatives échouées. Réessayez dans ${seconds} s.`);
  }
}

function recordFailedAttempt(email: string): void {
  if (!hasSessionStorage()) return;
  const attempts = getAttempts();
  const current = attempts[email] ?? { count: 0, lockedUntil: 0 };
  const nextCount =
    current.lockedUntil && current.lockedUntil <= Date.now() ? 1 : current.count + 1;
  attempts[email] = {
    count: nextCount,
    lockedUntil: nextCount >= MAX_FAILED_ATTEMPTS ? Date.now() + LOCKOUT_MS : 0,
  };
  window.sessionStorage.setItem(ATTEMPTS_KEY, JSON.stringify(attempts));
}

function clearFailedAttempts(email: string): void {
  if (!hasSessionStorage()) return;
  const attempts = getAttempts();
  if (attempts[email]) {
    delete attempts[email];
    window.sessionStorage.setItem(ATTEMPTS_KEY, JSON.stringify(attempts));
  }
}

function resolveAdminStatus(userId: string): boolean {
  return mockDB.getUserRole(userId).role === "admin";
}

function hasActiveAdmin(users: Record<string, UserRecord>): boolean {
  return Object.values(users).some((u) => !u.disabled && mockDB.getUserRole(u.id).role === "admin");
}

// ─── Contexte React ───────────────────────────────────────────────────────────

const Ctx = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sess = getStoredSession();
    if (sess) {
      const users = getUsers();
      const record = users[normalizeEmail(sess.user.email)];
      const profile = record ? mockDB.getProfile(record.id) : null;
      if (record && record.id === sess.user.id && !record.disabled && !profile?.disabled) {
        setSession(sess);
        setUser({
          id: record.id,
          email: record.email,
          user_metadata: record.user_metadata,
        });
        setIsAdmin(resolveAdminStatus(record.id));
      } else {
        saveSession(null);
      }
    }
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    const normalized = normalizeEmail(email);
    if (!isValidEmail(normalized)) {
      throw new Error("Adresse e-mail invalide.");
    }
    checkRateLimit(normalized);

    const users = getUsers();
    const record = users[normalized];
    const valid = record ? await verifyPassword(password, record.passwordHash) : false;

    if (!record || !valid) {
      recordFailedAttempt(normalized);
      throw new Error("E-mail ou mot de passe incorrect.");
    }

    const profile = mockDB.getProfile(record.id);
    if (record.disabled || profile?.disabled) {
      throw new Error("Ce compte a été désactivé. Contactez un administrateur.");
    }

    clearFailedAttempts(normalized);

    // Si aucun admin actif n'existe encore, promouvoir le compte configuré via VITE_ADMIN_EMAIL
    if (BOOTSTRAP_ADMIN_EMAIL && normalized === BOOTSTRAP_ADMIN_EMAIL && !hasActiveAdmin(users)) {
      mockDB.setUserRole(record.id, "admin");
    }

    const loggedUser: User = {
      id: record.id,
      email: record.email,
      user_metadata: record.user_metadata,
    };
    const sess: Session = {
      user: loggedUser,
      access_token: randomId("tok"),
      expires_at: Date.now() + SESSION_TTL_MS,
    };

    saveSession(sess);
    setSession(sess);
    setUser(loggedUser);
    setIsAdmin(resolveAdminStatus(record.id));
  };

  const signUp = async (email: string, password: string, metadata?: User["user_metadata"]) => {
    const normalized = normalizeEmail(email);
    if (!isValidEmail(normalized)) {
      throw new Error("Adresse e-mail invalide.");
    }

    const pwError = validatePasswordStrength(password);
    if (pwError) {
      throw new Error(pwError);
    }

    const users = getUsers();
    if (users[normalized]) {
      throw new Error("Un compte existe déjà avec cet e-mail.");
    }

    const safeMetadata: User["user_metadata"] = {
      full_name: sanitizeText(metadata?.full_name, 120),
      phone: sanitizeText(metadata?.phone, 40),
    };

    const id = randomId("user");
    const passwordHash = await hashPassword(password);
    const record: UserRecord = {
      id,
      email: normalized,
      passwordHash,
      user_metadata: safeMetadata,
    };

    users[normalized] = record;
    saveUsers(users);

    mockDB.createProfile({
      user_id: id,
      full_name: safeMetadata.full_name || normalized.split("@")[0],
      phone: safeMetadata.phone || "",
      created_at: new Date().toISOString(),
      disabled: false,
    });

    // Promotion admin uniquement si aucun admin actif n'existe et que l'e-mail correspond à VITE_ADMIN_EMAIL
    if (BOOTSTRAP_ADMIN_EMAIL && normalized === BOOTSTRAP_ADMIN_EMAIL && !hasActiveAdmin(users)) {
      mockDB.setUserRole(id, "admin");
    }

    const loggedUser: User = { id, email: normalized, user_metadata: safeMetadata };
    const sess: Session = {
      user: loggedUser,
      access_token: randomId("tok"),
      expires_at: Date.now() + SESSION_TTL_MS,
    };

    saveSession(sess);
    setSession(sess);
    setUser(loggedUser);
    setIsAdmin(resolveAdminStatus(id));
  };

  const handleSignOut = async () => {
    saveSession(null);
    setSession(null);
    setUser(null);
    setIsAdmin(false);
  };

  return (
    <Ctx.Provider
      value={{ user, session, isAdmin, loading, signOut: handleSignOut, signIn, signUp }}
    >
      {children}
    </Ctx.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
