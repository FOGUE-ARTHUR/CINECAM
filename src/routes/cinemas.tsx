import { createFileRoute, Link } from "@tanstack/react-router";
import { MapPin, Phone, Clapperboard, Ticket } from "lucide-react";
import { cinemas } from "@/data/cinemas";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/cinemas")({
  head: () => ({
    meta: [
      { title: "Our Cinemas — CINECAM" },
      {
        name: "description",
        content: "Find premium CINECAM theatres across Cameroon — Douala, Yaoundé, Garoua, Bamenda and more.",
      },
    ],
  }),
  component: CinemasPage,
});

function CinemasPage() {
  const { t } = useI18n();
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <span className="text-xs font-medium uppercase tracking-wider text-primary">
        {t("reserve.step")} 1 / 3
      </span>
      <h1 className="mt-1 font-display text-3xl font-bold sm:text-4xl">
        {t("reserve.cinemas.title")}
      </h1>
      <p className="mt-2 text-muted-foreground">
        {t("reserve.cinemas.subtitle")}
      </p>


      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {cinemas.map((c) => (
          <Link
            key={c.id}
            to="/reserver/$cinemaId"
            params={{ cinemaId: c.id }}
            className="group flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-[var(--shadow-glow)]"
          >
            <div className="relative aspect-video overflow-hidden">
              <img
                src={c.image}
                alt={c.name}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent opacity-70" />
              <span className="absolute left-3 top-3 rounded-full glass px-3 py-1 text-xs font-medium text-primary">
                {c.city}
              </span>
            </div>
            <div className="flex flex-1 flex-col p-5">
              <h2 className="font-display text-lg font-semibold">{c.name}</h2>
              <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                <p className="flex items-start gap-2">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-primary" /> {c.address}
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="size-4 shrink-0 text-primary" /> {c.contact}
                </p>
                <p className="flex items-center gap-2">
                  <Clapperboard className="size-4 shrink-0 text-primary" /> {c.rooms} {t("details.screens")}
                </p>
              </div>
              <span className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-[image:var(--gradient-gold)] px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-transform group-hover:scale-[1.02]">
                <Ticket className="size-4" /> {t("reserve.cinemas.cta")}
              </span>
            </div>
          </Link>
        ))}

      </div>
    </div>
  );
}
