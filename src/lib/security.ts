/**
 * Utilitaires de sécurité centralisés :
 *  - Validation et assainissement des URL / redirections / entrées
 *  - Hachage PBKDF2-SHA256 et comparaison en temps constant (Web Crypto API)
 *  - Génération cryptographique d'identifiants et codes billets
 */

const PBKDF2_ITERATIONS = 100_000;
const SALT_BYTES = 16;
const HASH_BITS = 256;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const YOUTUBE_ID_RE = /^[a-zA-Z0-9_-]{11}$/;
const SEAT_RE = /^[A-H](?:[1-9]|1[0-2])$/;

/**
 * Empêche les redirections ouvertes (Open Redirect) :
 * n'autorise que les chemins relatifs internes commençant par `/`.
 */
export function sanitizeRedirect(target: unknown, fallback = "/"): string {
  if (typeof target !== "string") return fallback;
  const trimmed = target.trim();
  if (!trimmed.startsWith("/")) return fallback;
  // Bloquer //evil.com, /\evil.com et les caractères de contrôle
  if (trimmed.startsWith("//") || trimmed.startsWith("/\\")) return fallback;
  if (/[\r\n\0]/.test(trimmed)) return fallback;
  try {
    const parsed = new URL(trimmed, "https://cinecam.local");
    if (parsed.origin !== "https://cinecam.local") return fallback;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}

/**
 * Valide qu'une URL d'image provient d'un schéma sûr (https:// ou chemin relatif /).
 */
export function isSafeImageUrl(url: unknown): url is string {
  if (typeof url !== "string") return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return true;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function isValidYouTubeId(id: unknown): id is string {
  return typeof id === "string" && YOUTUBE_ID_RE.test(id);
}

export function isValidSeatId(seat: unknown): seat is string {
  return typeof seat === "string" && SEAT_RE.test(seat);
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  const normalized = normalizeEmail(email);
  return normalized.length <= 254 && EMAIL_RE.test(normalized);
}

/**
 * Nettoie une chaîne utilisateur (suppression caractères de contrôle et borne de longueur).
 */
export function sanitizeText(value: unknown, maxLength = 200): string {
  if (typeof value !== "string") return "";
  const cleaned = Array.from(value)
    .filter((ch) => {
      const code = ch.charCodeAt(0);
      return code >= 0x20 && code !== 0x7f;
    })
    .join("");
  return cleaned.trim().slice(0, maxLength);
}

/**
 * Échappe les caractères spéciaux XML pour éviter l'injection XML dans sitemap.xml.
 */
export function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Vérifie la robustesse minimale d'un mot de passe.
 * Retourne un message d'erreur explicite ou `null` si valide.
 */
export function validatePasswordStrength(password: string): string | null {
  if (password.length < 8) {
    return "Le mot de passe doit contenir au moins 8 caractères.";
  }
  if (password.length > 128) {
    return "Le mot de passe ne doit pas dépasser 128 caractères.";
  }
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return "Le mot de passe doit contenir au moins une lettre et un chiffre.";
  }
  return null;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(hex: string): Uint8Array | null {
  if (hex.length % 2 !== 0 || !/^[0-9a-f]+$/i.test(hex)) return null;
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}

async function derivePbkdf2(
  password: string,
  salt: Uint8Array,
  iterations: number,
): Promise<Uint8Array> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, [
    "deriveBits",
  ]);
  const saltBuffer = new Uint8Array(salt).buffer as ArrayBuffer;
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: saltBuffer,
      iterations,
      hash: "SHA-256",
    },
    keyMaterial,
    HASH_BITS,
  );
  return new Uint8Array(bits);
}

/**
 * Hache un mot de passe avec PBKDF2-SHA256 et un sel aléatoire par utilisateur.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const derived = await derivePbkdf2(password, salt, PBKDF2_ITERATIONS);
  return `pbkdf2$${PBKDF2_ITERATIONS}$${bytesToHex(salt)}$${bytesToHex(derived)}`;
}

/**
 * Vérifie un mot de passe face à un hash PBKDF2 stocké.
 */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 4 || parts[0] !== "pbkdf2") return false;
  const iterations = Number(parts[1]);
  if (!Number.isInteger(iterations) || iterations < 10_000 || iterations > 1_000_000) {
    return false;
  }
  const salt = hexToBytes(parts[2]);
  const expected = hexToBytes(parts[3]);
  if (!salt || !expected) return false;
  const actual = await derivePbkdf2(password, salt, iterations);
  return constantTimeEqual(actual, expected);
}

/**
 * Génère un identifiant aléatoire cryptographique.
 */
export function randomId(prefix: string): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return `${prefix}_${bytesToHex(bytes)}`;
}

/**
 * Génère un code billet unique via CSPRNG.
 */
export function generateTicketCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  const token = bytesToHex(bytes).toUpperCase();
  return `CC-${token.slice(0, 4)}-${token.slice(4, 8)}-${token.slice(8, 12)}`;
}
