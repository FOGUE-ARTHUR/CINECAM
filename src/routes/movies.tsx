import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Search, SlidersHorizontal } from "lucide-react";
import { MovieCard } from "@/components/common/MovieCard";
import { movies, allGenres, type MovieCategory } from "@/data/movies";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/movies")({
  head: () => ({
    meta: [
      { title: "All Movies — CINECAM" },
      {
        name: "description",
        content: "Browse every movie now showing and coming soon at CINECAM. Filter by genre and category, search by title.",
      },
    ],
  }),
  component: MoviesPage,
});

const categories: { value: MovieCategory | "all"; key: string }[] = [
  { value: "all", key: "movies.all" },
  { value: "now_showing", key: "home.nowshowing" },
  { value: "popular", key: "home.popular" },
  { value: "coming_soon", key: "home.comingsoon" },
];

function MoviesPage() {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<MovieCategory | "all">("all");
  const [genre, setGenre] = useState<string>("all");

  const filtered = useMemo(() => {
    return movies.filter((m) => {
      const matchQuery = m.title.toLowerCase().includes(query.toLowerCase());
      const matchCat = category === "all" || m.category === category;
      const matchGenre = genre === "all" || m.genre.includes(genre);
      return matchQuery && matchCat && matchGenre;
    });
  }, [query, category, genre]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-bold sm:text-4xl">
        {t("movies.discover")} <span className="text-gradient-gold">{t("movies.title")}</span>
      </h1>
      <p className="mt-2 text-muted-foreground">
        {t("movies.available", { n: filtered.length })}
      </p>

      <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("movies.search")}
            className="pl-9"
            aria-label="Search movies"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {categories.map((c) => (
            <button
              key={c.value}
              onClick={() => setCategory(c.value)}
              className={cn(
                "rounded-full border border-border px-4 py-1.5 text-sm transition-colors",
                category === c.value
                  ? "bg-[image:var(--gradient-gold)] text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t(c.key as never)}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-2">
        <SlidersHorizontal className="size-4 shrink-0 text-muted-foreground" />
        <button
          onClick={() => setGenre("all")}
          className={cn(
            "shrink-0 rounded-full px-3 py-1 text-xs transition-colors",
            genre === "all" ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {t("movies.allgenres")}
        </button>
        {allGenres.map((g) => (
          <button
            key={g}
            onClick={() => setGenre(g)}
            className={cn(
              "shrink-0 rounded-full px-3 py-1 text-xs transition-colors",
              genre === g ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {g}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="py-24 text-center text-muted-foreground">
          {t("movies.none")}
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {filtered.map((m) => (
            <MovieCard key={m.id} movie={m} />
          ))}
        </div>
      )}
    </div>
  );
}
