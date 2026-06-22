import { Link } from "@tanstack/react-router";
import { Star, Clock } from "lucide-react";
import type { Movie } from "@/data/movies";
import { cn } from "@/lib/utils";

const FALLBACK =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='450'%3E%3Crect width='100%25' height='100%25' fill='%23222'/%3E%3C/svg%3E";

export function MovieCard({ movie, className }: { movie: Movie; className?: string }) {
  return (
    <Link
      to="/movies/$id"
      params={{ id: movie.id }}
      className={cn(
        "group relative block overflow-hidden rounded-xl border border-border/60 bg-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-[var(--shadow-glow)]",
        className,
      )}
    >
      <div className="relative aspect-[2/3] overflow-hidden">
        <img
          src={movie.poster}
          alt={movie.title}
          loading="lazy"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = FALLBACK;
          }}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent opacity-80" />
        <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full glass px-2 py-1 text-xs font-semibold text-primary">
          <Star className="size-3 fill-primary" /> {movie.rating.toFixed(1)}
        </span>
      </div>
      <div className="p-3">
        <h3 className="line-clamp-1 font-display text-sm font-semibold">{movie.title}</h3>
        <div className="mt-1.5 flex items-center justify-between text-xs text-muted-foreground">
          <span className="line-clamp-1">{movie.genre[0]}</span>
          <span className="flex shrink-0 items-center gap-1">
            <Clock className="size-3" /> {movie.durationMinutes}m
          </span>
        </div>
      </div>
    </Link>
  );
}
