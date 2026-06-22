import { Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";

const socialIcons = ["facebook", "instagram", "twitter", "youtube"] as const;

function SocialIcon({ name }: { name: string }) {
  const paths: Record<string, string> = {
    facebook: "M9 8H6v4h3v8h4v-8h3l1-4h-4V6.5a1 1 0 0 1 1-1h3V1.5h-3a5 5 0 0 0-5 5V8z",
    instagram:
      "M12 7.2A4.8 4.8 0 1 0 12 16.8 4.8 4.8 0 0 0 12 7.2zm0 7.9a3.1 3.1 0 1 1 0-6.2 3.1 3.1 0 0 1 0 6.2zM17.5 6a1.1 1.1 0 1 0 0 2.2 1.1 1.1 0 0 0 0-2.2zM21 7a6 6 0 0 0-1.6-4.2A6 6 0 0 0 15.2 1c-1.7-.1-6.7-.1-8.4 0A6 6 0 0 0 2.6 2.6 6 6 0 0 0 1 6.8c-.1 1.7-.1 6.7 0 8.4a6 6 0 0 0 1.6 4.2A6 6 0 0 0 6.8 21c1.7.1 6.7.1 8.4 0a6 6 0 0 0 4.2-1.6 6 6 0 0 0 1.6-4.2c.1-1.7.1-6.7 0-8.2z",
    twitter:
      "M18.9 1.2h3.7l-8 9.2 9.4 12.4h-7.4l-5.8-7.6-6.6 7.6H.5l8.6-9.8L0 1.2h7.6l5.2 6.9 6.1-6.9zm-1.3 19.5h2L6.5 3.3h-2.2l13.3 17.4z",
    youtube:
      "M23 7.5a3 3 0 0 0-2.1-2.1C19 4.9 12 4.9 12 4.9s-7 0-8.9.5A3 3 0 0 0 1 7.5C.5 9.4.5 12 .5 12s0 2.6.5 4.5a3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1c.5-1.9.5-4.5.5-4.5s0-2.6-.5-4.5zM9.8 15.3V8.7l6 3.3-6 3.3z",
  };
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="size-4" aria-hidden="true">
      <path d={paths[name]} />
    </svg>
  );
}
import logo from "@/assets/logo.png";

export function Footer() {
  const year = new Date().getFullYear();
  const { t } = useI18n();
  return (
    <footer className="mt-24 border-t border-border/60 bg-card/40">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-1">
          <Link to="/" className="flex items-center gap-2.5">
            <img src={logo} alt="CINECAM logo" width={36} height={36} className="h-9 w-9 object-contain" loading="lazy" />
            <span className="font-display text-xl font-bold">
              CINE<span className="text-gradient-gold">CAM</span>
            </span>
          </Link>
          <p className="mt-4 max-w-xs text-sm text-muted-foreground">
            {t("footer.tagline")}
          </p>
        </div>

        <FooterCol
          title={t("footer.explore")}
          items={[
            { label: t("nav.home"), to: "/" },
            { label: t("nav.movies"), to: "/movies" },
            { label: t("nav.cinemas"), to: "/cinemas" },
          ]}
        />
        <FooterCol
          title={t("footer.company")}
          items={[
            { label: t("footer.about"), to: "/" },
            { label: t("footer.contact"), to: "/" },
            { label: t("footer.privacy"), to: "/" },
            { label: t("footer.terms"), to: "/" },
          ]}
        />

        <div>
          <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-foreground">
            {t("footer.follow")}
          </h4>
          <div className="mt-4 flex gap-3">
            {socialIcons.map((name) => (
              <a
                key={name}
                href="#"
                aria-label={`${name} link`}
                className="inline-flex size-10 items-center justify-center rounded-full glass transition-colors hover:text-primary"
              >
                <SocialIcon name={name} />
              </a>
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-border/60 py-6 text-center text-xs text-muted-foreground">
        {t("footer.rights", { y: year })}
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  items,
}: {
  title: string;
  items: { label: string; to: string }[];
}) {
  return (
    <div>
      <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-foreground">
        {title}
      </h4>
      <ul className="mt-4 space-y-2.5">
        {items.map((it) => (
          <li key={it.label}>
            <Link
              to={it.to}
              className="text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              {it.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
