import { createFileRoute, Link } from "@tanstack/react-router";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectFade, Pagination } from "swiper/modules";
import { Star, Clock, Ticket, PlayCircle, TrendingUp, Calendar } from "lucide-react";
import "swiper/css";
import "swiper/css/effect-fade";
import "swiper/css/pagination";

import { Button } from "@/components/ui/button";
import { MovieRow } from "@/components/common/MovieRow";
import { movies, moviesByCategory } from "@/data/movies";
import { cinemas, cities } from "@/data/cinemas";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CINECAM — Book Cinema Tickets in Cameroon" },
      {
        name: "description",
        content:
          "Discover now showing, popular and upcoming movies. Reserve your seats at premium CINECAM theatres in Douala, Yaoundé, Garoua and more.",
      },
    ],
  }),
  component: HomePage,
});

const featured = movies.filter((m) =>
  ["dune-part-two", "oppenheimer", "spider-man-across", "the-batman"].includes(m.id),
);

function HomePage() {
  const { t } = useI18n();
  return (
    <div>
      {/* Hero */}
      <section className="relative">
        <Swiper
          modules={[Autoplay, EffectFade, Pagination]}
          effect="fade"
          autoplay={{ delay: 5000, disableOnInteraction: false }}
          pagination={{ clickable: true }}
          loop
          className="h-[78vh] min-h-[520px] w-full"
        >
          {featured.map((m) => (
            <SwiperSlide key={m.id}>
              <div className="relative h-full w-full">
                <img
                  src={m.backdrop}
                  alt={m.title}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = m.poster;
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-background/20" />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
                <div className="absolute inset-0 flex items-center">
                  <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
                    <div className="max-w-xl animate-fade-in">
                      <span className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs font-medium text-primary">
                        <TrendingUp className="size-3" /> {t("common.featured")}
                      </span>
                      <h1 className="mt-4 font-display text-4xl font-extrabold leading-tight sm:text-6xl">
                        {m.title}
                      </h1>
                      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1 text-primary">
                          <Star className="size-4 fill-primary" /> {m.rating.toFixed(1)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="size-4" /> {m.durationMinutes} {t("common.min")}
                        </span>
                        <span>{m.genre.join(" • ")}</span>
                      </div>
                      <p className="mt-4 line-clamp-3 max-w-lg text-muted-foreground">
                        {m.synopsis}
                      </p>
                      <div className="mt-7 flex flex-wrap gap-3">
                        <Link to="/cinemas">
                          <Button variant="gold" size="xl" className="gap-2">
                            <Ticket className="size-5" /> {t("common.booknow")}
                          </Button>
                        </Link>

                        <Link to="/movies/$id" params={{ id: m.id }}>
                          <Button variant="glass" size="xl" className="gap-2">
                            <PlayCircle className="size-5" /> {t("common.watchtrailer")}
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </section>

      <MovieRow
        title={t("home.nowshowing")}
        movies={moviesByCategory("now_showing")}
        icon={<PlayCircle className="size-7 text-primary" />}
      />
      <MovieRow
        title={t("home.popular")}
        movies={moviesByCategory("popular")}
        icon={<TrendingUp className="size-7 text-primary" />}
      />
      <MovieRow
        title={t("home.comingsoon")}
        movies={moviesByCategory("coming_soon")}
        icon={<Calendar className="size-7 text-primary" />}
      />

      {/* Cinemas teaser */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="glass overflow-hidden rounded-2xl p-8 sm:p-12">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <h2 className="font-display text-3xl font-bold">
                {t("home.cinemas.title", { n: cinemas.length, c: cities.length })}
              </h2>
              <p className="mt-2 max-w-xl text-muted-foreground">
                {t("home.cinemas.desc")}
              </p>
            </div>
            <Link to="/cinemas">
              <Button variant="gold" size="lg" className="gap-2">
                {t("home.cinemas.cta")} <ChevronRightIcon />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
