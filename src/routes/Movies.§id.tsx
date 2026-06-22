import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Star, Clock, Calendar, Ticket, ArrowLeft, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MovieCard } from "@/components/common/MovieCard";
import { getMovie, movies } from "@/data/movies";
import { cinemas } from "@/data/cinemas";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/movies/$id")({
  loader: ({ params }) => {
    const movie = getMovie(params.id);
    if (!movie) throw notFound();
    return { movie };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.movie.title} — CINECAM` },
          { name: "description", content: loaderData.movie.synopsis },
          { property: "og:title", content: `${loaderData.movie.title} — CINECAM` },
          { property: "og:description", content: loaderData.movie.synopsis },
          { property: "og:image", content: loaderData.movie.backdrop },
        ]
      : [],
  }),
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl px-4 py-32 text-center">
      <h1 className="font-display text-3xl font-bold">Film introuvable</h1>
      <Link to="/movies" className="mt-4 inline-block text-primary hover:underline">
        Retour aux films
      </Link>
    </div>
  ),
  errorComponent: () => (
    <div className="mx-auto max-w-2xl px-4 py-32 text-center">
      <h1 className="font-display text-2xl font-bold">Something went wrong</h1>
    </div>
  ),
  component: MovieDetails,
});

const showtimes = ["11:00", "14:30", "17:00", "20:30"];

function MovieDetails() {
  const { t } = useI18n();
  const { movie } = Route.useLoaderData();
  const related = movies.filter((m) => m.id !== movie.id && m.genre.some((g) => movie.genre.includes(g))).slice(0, 6);

  return (
    <div>
      {/* Backdrop hero */}
      <section className="relative">
        <div className="relative h-[52vh] min-h-[380px] w-full overflow-hidden">
          <img
            src={movie.backdrop}
            alt={movie.title}
            className="h-full w-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = movie.poster;
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/30" />
        </div>

        <div className="mx-auto -mt-48 max-w-7xl px-4 sm:px-6">
          <Link to="/movies" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" /> {t("common.back")}
          </Link>
          <div className="flex flex-col gap-8 md:flex-row">
            <img
              src={movie.poster}
              alt={movie.title}
              className="w-44 shrink-0 rounded-xl border border-border shadow-[var(--shadow-elegant)] md:w-60"
            />
            <div className="flex-1">
              <h1 className="font-display text-3xl font-extrabold sm:text-5xl">{movie.title}</h1>
              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1 text-primary">
                  <Star className="size-4 fill-primary" /> {movie.rating.toFixed(1)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="size-4" /> {movie.durationMinutes} {t("common.min")}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="size-4" /> {new Date(movie.releaseDate).getFullYear()}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {movie.genre.map((g: string) => (
                  <span key={g} className="rounded-full border border-border px-3 py-1 text-xs">
                    {g}
                  </span>
                ))}
              </div>
              <p className="mt-5 max-w-2xl text-muted-foreground">{movie.synopsis}</p>
              <dl className="mt-5 space-y-1 text-sm">
                <div className="flex gap-2">
                  <dt className="text-muted-foreground">{t("details.director")}</dt>
                  <dd>{movie.director}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-muted-foreground">{t("details.cast")}</dt>
                  <dd>{movie.actors.join(", ")}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </section>

      {/* Trailer */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <h2 className="mb-5 font-display text-2xl font-bold">{t("details.trailer")}</h2>
        <div className="aspect-video w-full overflow-hidden rounded-2xl border border-border">
          <iframe
            className="h-full w-full"
            src={`https://www.youtube.com/embed/${movie.trailerId}`}
            title={`${movie.title} trailer`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </section>

      {/* Showtimes */}
      {movie.category !== "coming_soon" && (
        <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
          <h2 className="mb-5 font-display text-2xl font-bold">{t("details.showtimes")}</h2>
          <div className="space-y-4">
            {cinemas.slice(0, 4).map((c) => (
              <div key={c.id} className="glass rounded-xl p-5">
                <div className="flex items-center gap-2">
                  <MapPin className="size-4 text-primary" />
                  <span className="font-display font-semibold">{c.name}</span>
                  <span className="text-sm text-muted-foreground">• {c.city}</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {showtimes.map((time) => (
                    <Link key={time} to="/book/$id" params={{ id: movie.id }}>
                      <Button variant="glass" size="sm" className="gap-2">
                        <Ticket className="size-3.5" /> {time}
                      </Button>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6">
            <Link to="/book/$id" params={{ id: movie.id }}>
              <Button variant="gold" size="lg" className="gap-2">
                <Ticket className="size-4" /> {t("common.booknow")}
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            {t("details.soonnote")}
          </p>
        </section>
      )}

      {related.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <h2 className="mb-5 font-display text-2xl font-bold">{t("details.related")}</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {related.map((m) => (
              <MovieCard key={m.id} movie={m} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
