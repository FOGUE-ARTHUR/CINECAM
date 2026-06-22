import { useMemo, useState } from "react";
import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Loader2,
  MapPin,
  Smartphone,
  CreditCard,
  Check,
  Clock,
  CalendarDays,
  Star,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getMovie, type Movie } from "@/data/movies";
import { cinemas } from "@/data/cinemas";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const SEAT_PRICE = 3000; // XAF — standard
const VIP_PRICE = 6000; // XAF — VIP
const ROWS = ["A", "B", "C", "D", "E", "F", "G", "H"];
const VIP_ROWS = ["G", "H"]; // last two rows are VIP
const COLS = 12;
const DATES = Array.from({ length: 5 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() + i);
  return d;
});
const TIMES = ["11:00", "14:30", "17:00", "20:30", "22:45"];

export const Route = createFileRoute("/book/$id")({
  validateSearch: (search: Record<string, unknown>): { cinema?: string } => ({
    cinema: typeof search.cinema === "string" ? search.cinema : undefined,
  }),
  loader: ({ params }) => {
    const movie = getMovie(params.id);
    if (!movie) throw notFound();
    return { movie };
  },
  head: ({ loaderData }) => ({
    meta: loaderData ? [{ title: `Réserver — ${loaderData.movie.title} — CINECAM` }] : [],
  }),
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl px-4 py-32 text-center">
      <h1 className="font-display text-2xl font-bold">Film introuvable</h1>
      <Link to="/movies" className="mt-4 inline-block text-primary hover:underline">← Films</Link>
    </div>
  ),
  component: BookingPage,
});

// deterministic "taken" seats per session so it feels real
function takenSeats(seed: string): Set<string> {
  const set = new Set<string>();
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  for (let i = 0; i < 14; i++) {
    h = (h * 1103515245 + 12345) >>> 0;
    const r = ROWS[h % ROWS.length];
    const c = (h % COLS) + 1;
    set.add(`${r}${c}`);
  }
  return set;
}

// derive a French film classification from genre (deterministic, no data change)
function classification(movie: Movie): string {
  const g = movie.genre.join(" ").toLowerCase();
  if (g.includes("animation") || g.includes("family")) return "Tous publics";
  if (g.includes("horror") || g.includes("thriller")) return "-16";
  if (g.includes("action") || g.includes("war") || g.includes("crime")) return "-12";
  return "-10";
}

const isVip = (row: string) => VIP_ROWS.includes(row);
const seatPrice = (seat: string) => (isVip(seat[0]) ? VIP_PRICE : SEAT_PRICE);
const fmtXAF = (n: number) => `${n.toLocaleString("fr-FR")} FCFA`;

interface Confirmation {
  ticketCode: string;
  movieTitle: string;
  cinemaName: string;
  date: string;
  time: string;
  seats: string[];
  total: number;
  method: string;
}

function BookingPage() {
  const { t, lang } = useI18n();
  const { movie } = Route.useLoaderData();
  const { cinema: cinemaParam } = Route.useSearch();
  const { user } = useAuth();
  const navigate = useNavigate();

  const initialCinema =
    cinemaParam && cinemas.some((c) => c.id === cinemaParam) ? cinemaParam : cinemas[0].id;
  const [cinemaId, setCinemaId] = useState(initialCinema);
  const [dateIdx, setDateIdx] = useState(0);
  const [time, setTime] = useState(TIMES[2]);
  const [seats, setSeats] = useState<string[]>([]);
  const [method, setMethod] = useState<"orange" | "mtn" | "card">("orange");
  const [loading, setLoading] = useState(false);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);

  const taken = useMemo(
    () => takenSeats(`${movie.id}-${cinemaId}-${dateIdx}-${time}`),
    [movie.id, cinemaId, dateIdx, time],
  );

  const toggleSeat = (s: string) => {
    if (taken.has(s)) return;
    setSeats((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  };

  const total = seats.reduce((sum, s) => sum + seatPrice(s), 0);
  const cinema = cinemas.find((c) => c.id === cinemaId)!;
  const date = DATES[dateIdx];
  const roomNumber = (Math.abs(cinemaId.length + dateIdx + TIMES.indexOf(time)) % cinema.rooms) + 1;

  const dateLabel = (d: Date) =>
    d.toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US", { weekday: "short", day: "numeric", month: "short" });

  const handlePay = async () => {
    if (!user) {
      navigate({ to: "/auth", search: { redirect: `/book/${movie.id}` } });
      return;
    }
    if (seats.length === 0) {
      toast.error(t("book.noseats"));
      return;
    }
    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 1400));
      const ticketCode = `CC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
      const methodLabel =
        method === "orange" ? "Orange Money" : method === "mtn" ? "MTN MoMo" : "Carte bancaire";
      const showDate = date.toISOString().slice(0, 10);
      const { error } = await supabase.from("bookings").insert({
        user_id: user.id,
        movie_id: movie.id,
        movie_title: movie.title,
        movie_poster: movie.poster,
        cinema_id: cinema.id,
        cinema_name: cinema.name,
        showtime: time,
        show_date: showDate,
        seats,
        total_amount: total,
        payment_method: methodLabel,
        payment_status: "paid",
        ticket_code: ticketCode,
      });
      if (error) throw error;
      toast.success(t("book.success"));
      setConfirmation({
        ticketCode,
        movieTitle: movie.title,
        cinemaName: cinema.name,
        date: dateLabel(date),
        time,
        seats,
        total,
        method: methodLabel,
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  // ---------- Confirmation screen ----------
  if (confirmation) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12 sm:px-6">
        <div className="glass rounded-3xl border border-border/60 p-6 text-center sm:p-8">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/15">
            <Check className="size-8 text-primary" />
          </div>
          <h1 className="mt-4 font-display text-2xl font-bold sm:text-3xl">{t("book.confirmed.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("book.confirmed.subtitle")}</p>

          <div className="mx-auto mt-6 w-fit rounded-2xl bg-white p-4">
            <QRCodeSVG value={confirmation.ticketCode} size={168} />
          </div>

          <p className="mt-4 text-[10px] uppercase tracking-wider text-muted-foreground">{t("book.confirmed.ref")}</p>
          <p className="font-mono text-sm font-semibold">{confirmation.ticketCode}</p>

          <dl className="mt-6 space-y-2 text-left text-sm">
            <Row label={t("book.movie")} value={confirmation.movieTitle} />
            <Row label={t("admin.cinema")} value={confirmation.cinemaName} />
            <Row label={t("book.selectdate")} value={confirmation.date} capitalize />
            <Row label={t("book.selecttime")} value={confirmation.time} />
            <Row label={t("book.seats")} value={confirmation.seats.join(", ")} />
            <Row label={t("book.payment")} value={confirmation.method} />
            <div className="flex items-center justify-between border-t border-border pt-3">
              <dt className="font-medium">{t("book.total")}</dt>
              <dd className="font-display text-lg font-bold text-primary">{fmtXAF(confirmation.total)}</dd>
            </div>
          </dl>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Button variant="gold" className="flex-1" onClick={() => navigate({ to: "/tickets" })}>
              {t("book.confirmed.tickets")}
            </Button>
            <Button variant="glass" className="flex-1" onClick={() => navigate({ to: "/" })}>
              {t("book.confirmed.home")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ---------- Booking screen ----------
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <Link to="/movies/$id" params={{ id: movie.id }} className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> {t("common.back")}
      </Link>

      {/* Movie header */}
      <div className="glass flex flex-col gap-5 rounded-2xl border border-border/60 p-5 sm:flex-row">
        <img src={movie.poster} alt={movie.title} className="h-48 w-32 shrink-0 self-center rounded-xl border border-border object-cover sm:self-start" />
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-bold sm:text-3xl">{movie.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            {movie.genre.map((g: string) => (
              <span key={g} className="rounded-full bg-secondary px-2.5 py-1 text-secondary-foreground">{g}</span>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><Clock className="size-4 text-primary" /> {movie.durationMinutes} {t("common.min")}</span>
            <span className="flex items-center gap-1.5"><Star className="size-4 text-primary" /> {movie.rating.toFixed(1)}/10</span>
            <span className="flex items-center gap-1.5">
              <span className="rounded border border-primary/50 px-1.5 text-[11px] font-semibold text-primary">{classification(movie)}</span>
              {t("book.classification")}
            </span>
          </div>
          <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{movie.synopsis}</p>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="space-y-8">
          {/* Cinema */}
          <section>
            <h2 className="mb-3 font-display text-lg font-semibold">{t("book.selectcinema")}</h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {cinemas.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCinemaId(c.id)}
                  className={cn(
                    "flex items-start gap-2 rounded-xl border p-3 text-left transition-colors",
                    cinemaId === c.id ? "border-primary bg-primary/10" : "border-border hover:border-primary/50",
                  )}
                >
                  <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span>
                    <span className="block text-sm font-medium">{c.name}</span>
                    <span className="block text-xs text-muted-foreground">{c.city}</span>
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* Date */}
          <section>
            <h2 className="mb-3 font-display text-lg font-semibold">{t("book.selectdate")}</h2>
            <div className="flex flex-wrap gap-2">
              {DATES.map((d, i) => (
                <button
                  key={i}
                  onClick={() => { setDateIdx(i); setSeats([]); }}
                  className={cn(
                    "rounded-lg border px-4 py-2 text-sm capitalize transition-colors",
                    dateIdx === i ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:text-foreground",
                  )}
                >
                  {dateLabel(d)}
                </button>
              ))}
            </div>
          </section>

          {/* Time */}
          <section>
            <h2 className="mb-3 font-display text-lg font-semibold">{t("book.selecttime")}</h2>
            <div className="flex flex-wrap gap-2">
              {TIMES.map((tm) => (
                <button
                  key={tm}
                  onClick={() => { setTime(tm); setSeats([]); }}
                  className={cn(
                    "rounded-lg border px-4 py-2 text-sm transition-colors",
                    time === tm ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:text-foreground",
                  )}
                >
                  {tm}
                </button>
              ))}
            </div>
          </section>

          {/* Seats */}
          <section>
            <h2 className="mb-3 font-display text-lg font-semibold">{t("book.selectseats")}</h2>
            <div className="glass rounded-2xl p-4 sm:p-6">
              <div className="mx-auto mb-6 h-2 w-3/4 rounded-full bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_30px_oklch(0.82_0.14_85/0.6)]" />
              <p className="mb-4 text-center text-xs tracking-[0.3em] text-muted-foreground">{t("book.screen")}</p>
              <div className="flex flex-col items-center gap-1.5 overflow-x-auto">
                {ROWS.map((row) => (
                  <div key={row} className="flex items-center gap-1.5">
                    <span className="w-4 text-xs text-muted-foreground">{row}</span>
                    {Array.from({ length: COLS }, (_, i) => i + 1).map((col) => {
                      const id = `${row}${col}`;
                      const isTaken = taken.has(id);
                      const isSel = seats.includes(id);
                      const vip = isVip(row);
                      return (
                        <button
                          key={id}
                          disabled={isTaken}
                          onClick={() => toggleSeat(id)}
                          aria-label={`Seat ${id}${vip ? " VIP" : ""}`}
                          title={`${id} — ${fmtXAF(vip ? VIP_PRICE : SEAT_PRICE)}`}
                          className={cn(
                            "size-5 rounded-t-md text-[8px] transition-colors sm:size-6",
                            isTaken && "cursor-not-allowed bg-destructive/70",
                            isSel && "bg-primary text-primary-foreground",
                            !isTaken && !isSel && vip && "bg-blue-500/60 hover:bg-blue-400",
                            !isTaken && !isSel && !vip && "bg-secondary hover:bg-primary/40",
                          )}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><span className="size-3 rounded-sm bg-secondary" /> {t("book.available")}</span>
                <span className="flex items-center gap-1.5"><span className="size-3 rounded-sm bg-primary" /> {t("book.selected")}</span>
                <span className="flex items-center gap-1.5"><span className="size-3 rounded-sm bg-destructive/70" /> {t("book.taken")}</span>
                <span className="flex items-center gap-1.5"><span className="size-3 rounded-sm bg-blue-500/60" /> {t("book.vip")} ({fmtXAF(VIP_PRICE)})</span>
              </div>
            </div>
          </section>
        </div>

        {/* Summary */}
        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <div className="glass rounded-2xl border border-border/60 p-5">
            <h2 className="font-display text-lg font-semibold">{t("book.summary")}</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <Row label={t("book.movie")} value={movie.title} />
              <Row label={t("admin.cinema")} value={cinema.name} />
              <Row label={t("book.city")} value={cinema.city} icon={<MapPin className="size-3.5 text-primary" />} />
              <Row label={t("book.room")} value={`${t("book.room")} ${roomNumber}`} icon={<Building2 className="size-3.5 text-primary" />} />
              <Row label={t("book.selectdate")} value={dateLabel(date)} capitalize icon={<CalendarDays className="size-3.5 text-primary" />} />
              <Row label={t("book.selecttime")} value={time} icon={<Clock className="size-3.5 text-primary" />} />
              <Row label={t("book.seats")} value={seats.length ? seats.join(", ") : "—"} />
            </dl>

            <div className="mt-4 border-t border-border pt-4">
              <p className="mb-2 text-sm font-medium">{t("book.payment")}</p>
              <div className="grid gap-2">
                {(["orange", "mtn"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMethod(m)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors",
                      method === m ? "border-primary bg-primary/10" : "border-border hover:border-primary/50",
                    )}
                  >
                    <Smartphone className="size-4 text-primary" />
                    {m === "orange" ? "Orange Money" : "MTN Mobile Money"}
                    {method === m && <Check className="ml-auto size-4 text-primary" />}
                  </button>
                ))}
                <button
                  onClick={() => setMethod("card")}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors",
                    method === "card" ? "border-primary bg-primary/10" : "border-border hover:border-primary/50",
                  )}
                >
                  <CreditCard className="size-4 text-primary" />
                  {t("book.card")}
                  <span className="ml-auto rounded-full bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground">{t("book.soon")}</span>
                  {method === "card" && <Check className="size-4 text-primary" />}
                </button>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
              <span className="text-muted-foreground">{t("book.total")}</span>
              <span className="font-display text-xl font-bold text-primary">{fmtXAF(total)}</span>
            </div>
            <p className="mt-1 text-right text-xs text-muted-foreground">{seats.length} {t("book.seats").toLowerCase()}</p>

            <Button variant="gold" className="mt-4 w-full gap-2" onClick={handlePay} disabled={loading}>
              {loading && <Loader2 className="size-4 animate-spin" />}
              {!user ? t("book.signinrequired") : loading ? t("book.processing") : `${t("book.pay")} ${seats.length ? fmtXAF(total) : ""}`}
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  capitalize,
  icon,
}: {
  label: string;
  value: string;
  capitalize?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="flex items-center gap-1.5 text-muted-foreground">{icon}{label}</dt>
      <dd className={cn("text-right font-medium", capitalize && "capitalize")}>{value}</dd>
    </div>
  );
}
