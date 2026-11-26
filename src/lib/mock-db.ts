/**
 * Base de données locale sécurisée (localStorage + validation Zod).
 * Remplace Supabase en mode local/développement.
 */
import { z } from "zod";
import { isSafeImageUrl, isValidSeatId, sanitizeText } from "./security";

// ─── Schémas & Types ──────────────────────────────────────────────────────────

export const PaymentStatusSchema = z.enum(["pending", "paid", "cancelled"]);
export type PaymentStatus = z.infer<typeof PaymentStatusSchema>;

export const BookingSchema = z.object({
  id: z.string().min(1).max(120),
  user_id: z.string().min(1).max(120),
  movie_title: z.string().min(1).max(200),
  cinema_name: z.string().min(1).max(200),
  cinema_id: z.string().min(1).max(100),
  showtime: z.string().min(1).max(20),
  show_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  seats: z.array(z.string().refine(isValidSeatId)).min(1).max(12),
  total_amount: z.number().int().positive().max(1_000_000),
  payment_method: z.string().min(1).max(60),
  payment_status: PaymentStatusSchema,
  ticket_code: z.string().min(1).max(80),
  created_at: z.string().min(1).max(50),
  movie_poster: z
    .string()
    .nullable()
    .optional()
    .transform((v) => (v && isSafeImageUrl(v) ? v : null)),
});

export type Booking = z.infer<typeof BookingSchema>;
export type BookingInput = z.input<typeof BookingSchema>;

export interface UserRole {
  user_id: string;
  role: "admin" | "user";
}

export const ProfileSchema = z.object({
  user_id: z.string().min(1).max(120),
  full_name: z.string().max(120),
  phone: z.string().max(40),
  created_at: z.string().min(1).max(50),
  disabled: z.boolean().optional(),
});

export type Profile = z.infer<typeof ProfileSchema>;

// ─── Clés localStorage ────────────────────────────────────────────────────────

const BOOKINGS_KEY = "cinecam_bookings";
const PROFILES_KEY = "cinecam_profiles";
const ADMINS_KEY = "cinecam_admins";

// ─── Helpers génériques ───────────────────────────────────────────────────────

function hasStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function loadValidated<Output>(
  key: string,
  schema: z.ZodType<Output, z.ZodTypeDef, unknown>,
): Output[] {
  if (!hasStorage()) return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const valid: Output[] = [];
    for (const item of parsed) {
      const res = schema.safeParse(item);
      if (res.success) valid.push(res.data);
    }
    return valid;
  } catch {
    return [];
  }
}

function save<T>(key: string, data: T[]): void {
  if (!hasStorage()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`[mockDB] Échec sauvegarde '${key}'`, e);
  }
}

function loadAdmins(): string[] {
  if (!hasStorage()) return [];
  try {
    const raw = window.localStorage.getItem(ADMINS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === "string" && id.length > 0);
  } catch {
    return [];
  }
}

// ─── API publique ─────────────────────────────────────────────────────────────

export const mockDB = {
  // ── Réservations ────────────────────────────────────────────────────────────

  /** Récupérer toutes les réservations, ou celles d'un utilisateur */
  getBookings(userId?: string): Booking[] {
    const all = loadValidated(BOOKINGS_KEY, BookingSchema);
    if (userId !== undefined) {
      if (!userId) return [];
      return all.filter((b) => b.user_id === userId);
    }
    return all;
  },

  /** Retourne les sièges déjà réservés (non annulés) pour une séance donnée */
  getReservedSeats(
    cinemaId: string,
    movieTitle: string,
    showDate: string,
    showtime: string,
  ): Set<string> {
    const all = loadValidated(BOOKINGS_KEY, BookingSchema);
    const taken = new Set<string>();
    for (const b of all) {
      if (
        b.payment_status !== "cancelled" &&
        b.cinema_id === cinemaId &&
        b.movie_title === movieTitle &&
        b.show_date === showDate &&
        b.showtime === showtime
      ) {
        for (const s of b.seats) taken.add(s);
      }
    }
    return taken;
  },

  /** Créer une réservation après validation stricte et contrôle de conflit de sièges */
  createBooking(booking: BookingInput): Booking {
    const uniqueSeats = Array.from(new Set(booking.seats));
    const parsed = BookingSchema.parse({
      ...booking,
      movie_title: sanitizeText(booking.movie_title, 200),
      cinema_name: sanitizeText(booking.cinema_name, 200),
      payment_method: sanitizeText(booking.payment_method, 60),
      seats: uniqueSeats,
    });

    const alreadyTaken = this.getReservedSeats(
      parsed.cinema_id,
      parsed.movie_title,
      parsed.show_date,
      parsed.showtime,
    );
    const conflict = parsed.seats.find((s) => alreadyTaken.has(s));
    if (conflict) {
      throw new Error(`Le siège ${conflict} vient déjà d'être réservé.`);
    }

    const all = loadValidated(BOOKINGS_KEY, BookingSchema);
    all.unshift(parsed);
    save(BOOKINGS_KEY, all);
    return parsed;
  },

  /** Mettre à jour une réservation */
  updateBooking(id: string, updates: { payment_status?: PaymentStatus }): Booking | null {
    const all = loadValidated(BOOKINGS_KEY, BookingSchema);
    const idx = all.findIndex((b) => b.id === id);
    if (idx === -1) return null;

    if (updates.payment_status !== undefined) {
      const status = PaymentStatusSchema.parse(updates.payment_status);
      all[idx] = { ...all[idx], payment_status: status };
    }
    save(BOOKINGS_KEY, all);
    return all[idx];
  },

  /** Supprimer une réservation */
  deleteBooking(id: string): void {
    const all = loadValidated(BOOKINGS_KEY, BookingSchema).filter((b) => b.id !== id);
    save(BOOKINGS_KEY, all);
  },

  // ── Rôles utilisateur ────────────────────────────────────────────────────────

  /** Vérifier si un utilisateur est admin */
  getUserRole(userId: string): UserRole {
    const admins = loadAdmins();
    if (admins.includes(userId)) {
      return { user_id: userId, role: "admin" };
    }
    return { user_id: userId, role: "user" };
  },

  /** Vérifier s'il existe au moins un administrateur */
  hasAnyAdmin(): boolean {
    return loadAdmins().length > 0;
  },

  /** Définir un rôle (admin/user) */
  setUserRole(userId: string, role: "admin" | "user"): void {
    if (!userId) return;
    let admins = loadAdmins();
    if (role === "admin" && !admins.includes(userId)) {
      admins.push(userId);
    } else if (role === "user") {
      admins = admins.filter((id) => id !== userId);
    }
    save(ADMINS_KEY, admins);
  },

  // ── Profils ─────────────────────────────────────────────────────────────────

  /** Récupérer un profil */
  getProfile(userId: string): Profile | null {
    const all = loadValidated(PROFILES_KEY, ProfileSchema);
    return all.find((p) => p.user_id === userId) ?? null;
  },

  /** Créer ou mettre à jour un profil */
  createProfile(profile: Profile): Profile {
    const sanitized = ProfileSchema.parse({
      ...profile,
      full_name: sanitizeText(profile.full_name, 120),
      phone: sanitizeText(profile.phone, 40),
    });
    const all = loadValidated(PROFILES_KEY, ProfileSchema);
    const idx = all.findIndex((p) => p.user_id === sanitized.user_id);
    if (idx >= 0) {
      all[idx] = { ...all[idx], ...sanitized };
    } else {
      all.push(sanitized);
    }
    save(PROFILES_KEY, all);
    return sanitized;
  },

  /** Activer/désactiver un profil utilisateur */
  setProfileDisabled(userId: string, disabled: boolean): Profile | null {
    const all = loadValidated(PROFILES_KEY, ProfileSchema);
    const idx = all.findIndex((p) => p.user_id === userId);
    if (idx === -1) return null;
    all[idx] = { ...all[idx], disabled };
    save(PROFILES_KEY, all);
    return all[idx];
  },

  // ── Données globales (admin dashboard) ──────────────────────────────────────

  getData(): { bookings: Booking[]; userRoles: UserRole[]; profiles: Profile[] } {
    const bookings = loadValidated(BOOKINGS_KEY, BookingSchema);
    const profiles = loadValidated(PROFILES_KEY, ProfileSchema);
    const admins = new Set(loadAdmins());
    const userRoles: UserRole[] = profiles.map((p) => ({
      user_id: p.user_id,
      role: admins.has(p.user_id) ? ("admin" as const) : ("user" as const),
    }));
    return { bookings, userRoles, profiles };
  },

  /** Compatibilité : init() n'est plus nécessaire (plus de WASM) */
  init: async () => {
    // No-op : la BD JSON est immédiatement disponible
  },
};
