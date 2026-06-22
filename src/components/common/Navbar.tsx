import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, X, Search, Film, User, Globe, Ticket, LogOut, LayoutDashboard } from "lucide-react";
import logo from "@/assets/logo.png";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { t, lang, setLang } = useI18n();
  const { user, isAdmin, signOut } = useAuth();

  const links = [
    { to: "/", label: t("nav.home") },
    { to: "/movies", label: t("nav.movies") },
    { to: "/cinemas", label: t("nav.cinemas") },
  ];

  const LangToggle = ({ className }: { className?: string }) => (
    <button
      onClick={() => setLang(lang === "fr" ? "en" : "fr")}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-2 text-xs font-semibold uppercase transition-colors hover:text-primary",
        className,
      )}
      aria-label={lang === "fr" ? "Switch to English" : "Passer en français"}
    >
      <Globe className="size-4" />
      {lang === "fr" ? "FR" : "EN"}
    </button>
  );

  const AccountMenu = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="glass" size="sm" className="gap-2">
          <User className="size-4" />
          <span className="max-w-24 truncate">{user?.email?.split("@")[0]}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem asChild>
          <Link to="/tickets" className="gap-2">
            <Ticket className="size-4" /> {t("auth.mytickets")}
          </Link>
        </DropdownMenuItem>
        {isAdmin && (
          <DropdownMenuItem asChild>
            <Link to="/admin" className="gap-2">
              <LayoutDashboard className="size-4" /> {t("auth.admin")}
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut()} className="gap-2">
          <LogOut className="size-4" /> {t("auth.signout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <header className="sticky top-0 z-50">
      <div className="glass border-b border-border/60">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5" aria-label="CINECAM home">
            <img src={logo} alt="CINECAM logo" width={36} height={36} className="h-9 w-9 object-contain drop-shadow-[0_0_10px_oklch(0.82_0.14_85/0.5)]" />
            <span className="font-display text-xl font-bold tracking-tight">
              CINE<span className="text-gradient-gold">CAM</span>
            </span>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                  pathname === l.to && "text-foreground",
                )}
                activeOptions={{ exact: l.to === "/" }}
                activeProps={{ className: "text-primary" }}
              >
                {l.label}
              </Link>
            ))}
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <LangToggle />
            <Link to="/movies" aria-label="Search movies">
              <Button variant="glass" size="icon">
                <Search className="size-4" />
              </Button>
            </Link>
            {user ? (
              <AccountMenu />
            ) : (
              <Link to="/auth">
                <Button variant="gold" size="sm" className="gap-2">
                  <User className="size-4" /> {t("nav.signin")}
                </Button>
              </Link>
            )}
          </div>

          <div className="flex items-center gap-1 md:hidden">
            <LangToggle />
            <button
              className="inline-flex size-10 items-center justify-center rounded-lg"
              onClick={() => setOpen((v) => !v)}
              aria-label="Toggle menu"
              aria-expanded={open}
            >
              {open ? <X /> : <Menu />}
            </button>
          </div>
        </nav>

        {open && (
          <div className="animate-fade-in border-t border-border/60 px-4 py-4 md:hidden">
            <div className="flex flex-col gap-1">
              {links.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-3 text-sm font-medium hover:bg-accent/40"
                  activeProps={{ className: "text-primary" }}
                  activeOptions={{ exact: l.to === "/" }}
                >
                  <Film className="size-4" /> {l.label}
                </Link>
              ))}
              {user ? (
                <>
                  <Link to="/tickets" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-3 text-sm font-medium hover:bg-accent/40">
                    <Ticket className="size-4" /> {t("auth.mytickets")}
                  </Link>
                  {isAdmin && (
                    <Link to="/admin" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-3 text-sm font-medium hover:bg-accent/40">
                      <LayoutDashboard className="size-4" /> {t("auth.admin")}
                    </Link>
                  )}
                  <Button variant="glass" className="mt-2 gap-2" onClick={() => { signOut(); setOpen(false); }}>
                    <LogOut className="size-4" /> {t("auth.signout")}
                  </Button>
                </>
              ) : (
                <Link to="/auth" onClick={() => setOpen(false)}>
                  <Button variant="gold" className="mt-2 w-full gap-2">
                    <User className="size-4" /> {t("nav.signin")}
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
