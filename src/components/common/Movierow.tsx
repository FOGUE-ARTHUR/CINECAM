import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { MovieCard } from "./MovieCard";
import type { Movie } from "@/data/movies";
import { useI18n } from "@/lib/i18n";

export function MovieRow({
  title,
  movies,
  icon,
}: {
  title: string;
  movies: Movie[];
  icon?: React.ReactNode;
}) {
  const { t } = useI18n();
  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-display text-2xl font-bold sm:text-3xl">
          {icon}
          {title}
        </h2>
        <Link
          to="/movies"
          className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          {t("common.viewall")} <ChevronRight className="size-4" />
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {movies.slice(0, 6).map((m) => (
          <MovieCard key={m.id} movie={m} />
        ))}
      </div>
    </section>
  );
}
