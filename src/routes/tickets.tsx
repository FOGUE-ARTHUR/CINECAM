import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { QRCodeSVG } from "qrcode.react";
import { Ticket, Calendar, Clock, MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/tickets")({
  head: () => ({ meta: [{ title: "Mes billets — CINECAM" }] }),
  component: TicketsPage,
});

interface Booking {
  id: string;
  movie_title: string;
  movie_poster: string | null;
  cinema_name: string;
  showtime: string;
  show_date: string;
  seats: string[];
  total_amount: number;
  payment_method: string;
  ticket_code: string;
  created_at: string;
}

const fmtXAF = (n: number) => `${n.toLocaleString("fr-FR")} FCFA`;

function TicketsPage() {
  const { t, lang } = useI18n();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate({ to: "/auth", search: { redirect: "/tickets" } });
      return;
    }
    supabase
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setBookings((data as Booking[]) ?? []);
        setLoading(false);
      });
  }, [user, authLoading, navigate]);

  if (loading || authLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-bold sm:text-4xl">
        {t("tickets.title").split(" ")[0]} <span className="text-gradient-gold">{t("tickets.title").split(" ").slice(1).join(" ")}</span>
      </h1>

      {bookings.length === 0 ? (
        <div className="mt-16 flex flex-col items-center text-center">
          <Ticket className="size-12 text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">{t("tickets.empty")}</p>
          <Link to="/movies" className="mt-6">
            <Button variant="gold">{t("tickets.browse")}</Button>
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {bookings.map((b) => (
            <div key={b.id} className="glass overflow-hidden rounded-2xl border border-border/60">
              <div className="flex">
                {b.movie_poster && (
                  <img src={b.movie_poster} alt={b.movie_title} className="w-24 shrink-0 object-cover" />
                )}
                <div className="flex-1 p-4">
                  <h2 className="font-display font-bold leading-tight">{b.movie_title}</h2>
                  <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                    <p className="flex items-center gap-1.5"><MapPin className="size-3.5 text-primary" /> {b.cinema_name}</p>
                    <p className="flex items-center gap-1.5"><Calendar className="size-3.5 text-primary" /> {new Date(b.show_date).toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US", { weekday: "long", day: "numeric", month: "long" })}</p>
                    <p className="flex items-center gap-1.5"><Clock className="size-3.5 text-primary" /> {b.showtime}</p>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {b.seats.map((s) => (
                      <span key={s} className="rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">{s}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-dashed border-border bg-secondary/30 p-4">
                <div className="rounded-lg bg-white p-2">
                  <QRCodeSVG value={b.ticket_code} size={72} />
                </div>
                <div className="flex-1 text-right">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("tickets.ref")}</p>
                  <p className="font-mono text-xs font-semibold">{b.ticket_code}</p>
                  <p className="mt-1 text-sm font-bold text-primary">{fmtXAF(b.total_amount)}</p>
                  <p className="text-[10px] text-muted-foreground">{b.payment_method}</p>
                </div>
              </div>
              <p className="px-4 pb-3 text-center text-[10px] text-muted-foreground">{t("tickets.scan")}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
