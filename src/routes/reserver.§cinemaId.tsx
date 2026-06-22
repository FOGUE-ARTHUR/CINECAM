import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, MapPin, Star, Clock, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cinemas } from "@/data/cinemas";
import { movies } from "@/data/movies";
import { useI18n } from "@/lib/i18n";

const FALLBACK =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='450'%3E%3Crect width='100%25' height='100%25' fill='%23222'/%3E%3C/svg%3E";

export const Route = createFileRoute("/reserver/$cinemaId")({
  loader: ({ params }) => {
    const cinema = cinemas.find((c) => c.id === params.cinemaId);
    if (!cinema) throw notFound();
    return { cinema };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [{ title: `Réserver — ${loaderData.cinema.name} — CINECAM` }]
      : [],
  }),
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl px-4 py-32 text-center">
      <h1 className="font-display text-2xl font-bold">Cinéma introuvable</h1>
      <Link to="/cinemas" className="mt-4 inline-block text-primary hover:underline">
        ← Cinémas
      </Link>
    </div>
  ),
  component: ReserverCinemaPage,
});

function ReserverCinemaPage() {
  const { t } = useI18n();
  const { cinema } = Route.useLoaderData();
  const showing = movies.filter((m) => m.category !== "coming_soon");

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <Link
        to="/cinemas"
        className="mb-6 flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> {t("reserve.back.cinemas")}
      </Link>



      <span className="text-xs font-medium uppercase tracking-wider text-primary">
        {t("reserve.step")} 2 / 3
      </span>
      <h1 className="mt-1 font-display text-3xl font-bold sm:text-4xl">
        {cinema.name}
      </h1>
      <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
        <MapPin className="size-4 text-primary" /> {cinema.address} — {cinema.city}
      </p>
      <h2 className="mt-8 font-display text-xl font-semibold">
        {t("reserve.films.title")}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {t("reserve.films.subtitle", { name: cinema.name })}
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {showing.map((m) => (
          <Link
            key={m.id}
            to="/book/$id"
            params={{ id: m.id }}
            search={{ cinema: cinema.id }}
            className="group relative block overflow-hidden rounded-xl border border-border/60 bg-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-[var(--shadow-glow)]"
          >
            <div className="relative aspect-[2/3] overflow-hidden">
              <img
                src={m.poster}
                alt={m.title}
                loading="lazy"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = FALLBACK;
                }}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent opacity-80" />
              <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full glass px-2 py-1 text-xs font-semibold text-primary">
                <Star className="size-3 fill-primary" /> {m.rating.toFixed(1)}
              </span>
              <div className="absolute inset-x-0 bottom-0 flex translate-y-2 items-center justify-center p-3 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                <Button variant="gold" size="sm" className="w-full gap-1.5">
                  <Ticket className="size-4" /> {t("reserve.films.book")}
                </Button>
              </div>
            </div>
            <div className="p-3">
              <h3 className="line-clamp-1 font-display text-sm font-semibold">{m.title}</h3>
              <div className="mt-1.5 flex items-center justify-between text-xs text-muted-foreground">
                <span className="line-clamp-1">{m.genre[0]}</span>
                <span className="flex shrink-0 items-center gap-1">
                  <Clock className="size-3" /> {m.durationMinutes}m
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
