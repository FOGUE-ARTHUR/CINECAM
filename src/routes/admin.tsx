import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Film,
  Building2,
  DoorOpen,
  CalendarClock,
  Ticket as TicketIcon,
  Users,
  CreditCard,
  BarChart3,
  Settings as SettingsIcon,
  Loader2,
  ShieldAlert,
  TrendingUp,
  ShoppingBag,
  Bell,
  Search,
  CheckCircle2,
  XCircle,
  Menu,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  ResponsiveContainer,
} from "recharts";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { cinemas as seedCinemas } from "@/data/cinemas";
import { movies as seedMovies } from "@/data/movies";
import {
  seedRooms,
  seedShowtimes,
  fmtXAF,
  type Room,
  type Showtime,
} from "@/lib/admin-data";
import { CrudModule, type ColumnDef } from "@/components/admin/CrudModule";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Administration — CINECAM" }] }),
  component: AdminPage,
});

interface Booking {
  id: string;
  user_id: string;
  movie_title: string;
  cinema_name: string;
  cinema_id: string;
  showtime: string;
  show_date: string;
  seats: string[];
  total_amount: number;
  payment_method: string;
  payment_status: string;
  ticket_code: string;
  created_at: string;
}

interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  disabled: boolean;
  created_at: string;
}

type Section =
  | "dashboard"
  | "movies"
  | "cinemas"
  | "rooms"
  | "showtimes"
  | "bookings"
  | "users"
  | "payments"
  | "stats"
  | "settings";

const GOLD = "oklch(0.82 0.14 85)";
const GRID = "oklch(0.3 0.025 265)";

function AdminPage() {
  const { t } = useI18n();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [section, setSection] = useState<Section>("dashboard");
  const [navOpen, setNavOpen] = useState(false);
  const [globalQuery, setGlobalQuery] = useState("");

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  // client-side managed datasets (seeded from static data)
  const [moviesList, setMoviesList] = useState(() =>
    seedMovies.map((m) => ({
      id: m.id,
      title: m.title,
      genre: m.genre.join(", "),
      durationMinutes: m.durationMinutes,
      rating: m.rating,
      category: m.category,
    })),
  );
  const [cinemasList, setCinemasList] = useState(() =>
    seedCinemas.map((c) => ({
      id: c.id,
      name: c.name,
      city: c.city,
      address: c.address,
      rooms: c.rooms,
      contact: c.contact,
    })),
  );
  const [rooms, setRooms] = useState<Room[]>(() => seedRooms());
  const [showtimes, setShowtimes] = useState<Showtime[]>(() => seedShowtimes(seedRooms()));

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate({ to: "/auth", search: { redirect: "/admin" } });
      return;
    }
    if (!isAdmin) {
      setLoading(false);
      return;
    }
    Promise.all([
      supabase.from("bookings").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
    ]).then(([b, p]) => {
      setBookings((b.data as Booking[]) ?? []);
      setProfiles((p.data as Profile[]) ?? []);
      setLoading(false);
    });
  }, [user, isAdmin, authLoading, navigate]);

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
        <ShieldAlert className="size-12 text-muted-foreground" />
        <p className="mt-4 text-muted-foreground">{t("admin.noaccess")}</p>
        <Link to="/" className="mt-6">
          <Button variant="gold">{t("nav.home")}</Button>
        </Link>
      </div>
    );
  }

  const revenue = bookings
    .filter((b) => b.payment_status !== "cancelled")
    .reduce((s, b) => s + b.total_amount, 0);

  const navItems: { id: Section; label: string; icon: typeof LayoutDashboard }[] = [
    { id: "dashboard", label: t("admin.nav.dashboard"), icon: LayoutDashboard },
    { id: "movies", label: t("admin.nav.movies"), icon: Film },
    { id: "cinemas", label: t("admin.nav.cinemas"), icon: Building2 },
    { id: "rooms", label: t("admin.nav.rooms"), icon: DoorOpen },
    { id: "showtimes", label: t("admin.nav.showtimes"), icon: CalendarClock },
    { id: "bookings", label: t("admin.nav.bookings"), icon: TicketIcon },
    { id: "users", label: t("admin.nav.users"), icon: Users },
    { id: "payments", label: t("admin.nav.payments"), icon: CreditCard },
    { id: "stats", label: t("admin.nav.stats"), icon: BarChart3 },
    { id: "settings", label: t("admin.nav.settings"), icon: SettingsIcon },
  ];

  const cinemaName = (id: string) => cinemasList.find((c) => c.id === id)?.name ?? id;
  const movieTitle = (id: string) => moviesList.find((m) => m.id === id)?.title ?? id;

  // ---- Booking actions (DB) ----
  const updateBookingStatus = async (b: Booking, status: string) => {
    const { error } = await supabase
      .from("bookings")
      .update({ payment_status: status })
      .eq("id", b.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setBookings((prev) => prev.map((x) => (x.id === b.id ? { ...x, payment_status: status } : x)));
    toast.success(status === "paid" ? t("admin.confirm") + " ✓" : t("admin.cancel") + " ✓");
  };

  const toggleUser = async (p: Profile) => {
    const { error } = await supabase
      .from("profiles")
      .update({ disabled: !p.disabled })
      .eq("id", p.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setProfiles((prev) => prev.map((x) => (x.id === p.id ? { ...x, disabled: !x.disabled } : x)));
    toast.success("✓");
  };

  return (
    <div className="mx-auto flex max-w-7xl gap-6 px-3 py-6 sm:px-6">
      {/* Sidebar */}
      <aside
        className={`${
          navOpen ? "block" : "hidden"
        } fixed inset-0 z-40 bg-background/95 p-4 lg:static lg:z-auto lg:block lg:w-60 lg:shrink-0 lg:bg-transparent lg:p-0`}
      >
        <div className="glass sticky top-20 rounded-2xl border border-border/60 p-3">
          <div className="mb-2 flex items-center justify-between px-2 lg:hidden">
            <span className="font-display font-semibold">CINECAM</span>
            <Button size="icon" variant="ghost" onClick={() => setNavOpen(false)}>
              <XCircle className="size-5" />
            </Button>
          </div>
          <nav className="space-y-1">
            {navItems.map((it) => (
              <button
                key={it.id}
                onClick={() => {
                  setSection(it.id);
                  setNavOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  section === it.id
                    ? "bg-[image:var(--gradient-gold)] text-primary-foreground shadow-[var(--shadow-glow)]"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                <it.icon className="size-4 shrink-0" />
                {it.label}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main */}
      <div className="min-w-0 flex-1">
        {/* Topbar */}
        <div className="mb-6 flex items-center gap-3">
          <Button size="icon" variant="outline" className="lg:hidden" onClick={() => setNavOpen(true)}>
            <Menu className="size-4" />
          </Button>
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={globalQuery}
              onChange={(e) => setGlobalQuery(e.target.value)}
              placeholder={t("admin.search")}
              className="pl-9"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="outline" className="relative">
                <Bell className="size-4" />
                {bookings.filter((b) => b.payment_status === "pending").length > 0 && (
                  <span className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    {bookings.filter((b) => b.payment_status === "pending").length}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              <DropdownMenuLabel>{t("admin.nav.bookings")}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {bookings.slice(0, 5).map((b) => (
                <DropdownMenuItem key={b.id} className="flex-col items-start">
                  <span className="font-medium">{b.movie_title}</span>
                  <span className="text-xs text-muted-foreground">
                    {b.cinema_name} · {fmtXAF(b.total_amount)}
                  </span>
                </DropdownMenuItem>
              ))}
              {bookings.length === 0 && (
                <DropdownMenuItem disabled>{t("admin.empty")}</DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {section === "dashboard" && (
          <DashboardSection
            bookings={bookings}
            revenue={revenue}
            moviesCount={moviesList.length}
            usersCount={profiles.length}
          />
        )}

        {section === "movies" && (
          <SectionShell title={t("admin.nav.movies")}>
            <CrudModule
              title={t("admin.nav.movies")}
              items={moviesList}
              globalQuery={globalQuery}
              searchKeys={["title", "genre"]}
              filter={{
                key: "category",
                label: t("admin.nav.movies"),
                options: [
                  { value: "now_showing", label: "Now showing" },
                  { value: "popular", label: "Popular" },
                  { value: "coming_soon", label: "Coming soon" },
                ],
              }}
              fields={[
                { key: "title", label: "Titre" },
                { key: "genre", label: "Genre" },
                { key: "durationMinutes", label: "Durée (min)", type: "number" },
                { key: "rating", label: "Note", type: "number" },
                {
                  key: "category",
                  label: "Catégorie",
                  type: "select",
                  options: [
                    { value: "now_showing", label: "Now showing" },
                    { value: "popular", label: "Popular" },
                    { value: "coming_soon", label: "Coming soon" },
                  ],
                },
              ]}
              columns={[
                { key: "title", label: "Titre", className: "font-medium" },
                { key: "genre", label: "Genre", className: "text-muted-foreground" },
                { key: "durationMinutes", label: "Durée", render: (m) => `${m.durationMinutes} min` },
                { key: "rating", label: "Note" },
              ]}
              onCreate={(d) =>
                setMoviesList((p) => [
                  {
                    id: `movie-${Date.now()}`,
                    title: d.title,
                    genre: d.genre,
                    durationMinutes: Number(d.durationMinutes) || 0,
                    rating: Number(d.rating) || 0,
                    category: d.category as never,
                  },
                  ...p,
                ])
              }
              onUpdate={(id, d) =>
                setMoviesList((p) =>
                  p.map((m) =>
                    m.id === id
                      ? {
                          ...m,
                          title: d.title,
                          genre: d.genre,
                          durationMinutes: Number(d.durationMinutes) || 0,
                          rating: Number(d.rating) || 0,
                          category: d.category as never,
                        }
                      : m,
                  ),
                )
              }
              onDelete={(id) => setMoviesList((p) => p.filter((m) => m.id !== id))}
            />
          </SectionShell>
        )}

        {section === "cinemas" && (
          <SectionShell title={t("admin.nav.cinemas")}>
            <CrudModule
              title={t("admin.nav.cinemas")}
              items={cinemasList}
              globalQuery={globalQuery}
              searchKeys={["name", "city", "address"]}
              filter={{
                key: "city",
                label: "Ville",
                options: Array.from(new Set(seedCinemas.map((c) => c.city))).map((c) => ({
                  value: c,
                  label: c,
                })),
              }}
              fields={[
                { key: "name", label: "Nom" },
                { key: "city", label: "Ville" },
                { key: "address", label: "Adresse" },
                { key: "rooms", label: "Salles", type: "number" },
                { key: "contact", label: "Contact" },
              ]}
              columns={[
                { key: "name", label: "Nom", className: "font-medium" },
                { key: "city", label: "Ville", className: "text-muted-foreground" },
                { key: "rooms", label: "Salles" },
                { key: "contact", label: "Contact", className: "text-muted-foreground" },
              ]}
              onCreate={(d) =>
                setCinemasList((p) => [
                  {
                    id: `cinema-${Date.now()}`,
                    name: d.name,
                    city: d.city,
                    address: d.address,
                    rooms: Number(d.rooms) || 0,
                    contact: d.contact,
                  },
                  ...p,
                ])
              }
              onUpdate={(id, d) =>
                setCinemasList((p) =>
                  p.map((c) =>
                    c.id === id
                      ? { ...c, name: d.name, city: d.city, address: d.address, rooms: Number(d.rooms) || 0, contact: d.contact }
                      : c,
                  ),
                )
              }
              onDelete={(id) => setCinemasList((p) => p.filter((c) => c.id !== id))}
            />
          </SectionShell>
        )}

        {section === "rooms" && (
          <SectionShell title={t("admin.nav.rooms")}>
            <CrudModule
              title={t("admin.nav.rooms")}
              items={rooms}
              globalQuery={globalQuery}
              searchKeys={["name", "type"]}
              filter={{
                key: "cinemaId",
                label: t("admin.nav.cinemas"),
                options: cinemasList.map((c) => ({ value: c.id, label: c.name })),
              }}
              fields={[
                { key: "name", label: "Nom" },
                {
                  key: "cinemaId",
                  label: t("admin.nav.cinemas"),
                  type: "select",
                  options: cinemasList.map((c) => ({ value: c.id, label: c.name })),
                },
                { key: "capacity", label: "Capacité", type: "number" },
                {
                  key: "type",
                  label: "Type",
                  type: "select",
                  options: ["Standard", "VIP", "IMAX", "3D"].map((v) => ({ value: v, label: v })),
                },
              ]}
              columns={[
                { key: "name", label: "Nom", className: "font-medium" },
                { key: "cinemaId", label: t("admin.nav.cinemas"), render: (r) => cinemaName(r.cinemaId), className: "text-muted-foreground" },
                { key: "capacity", label: "Capacité" },
                { key: "type", label: "Type", render: (r) => <Badge variant="secondary">{r.type}</Badge> },
              ]}
              onCreate={(d) =>
                setRooms((p) => [
                  { id: `room-${Date.now()}`, name: d.name, cinemaId: d.cinemaId, capacity: Number(d.capacity) || 0, type: d.type },
                  ...p,
                ])
              }
              onUpdate={(id, d) =>
                setRooms((p) =>
                  p.map((r) =>
                    r.id === id ? { ...r, name: d.name, cinemaId: d.cinemaId, capacity: Number(d.capacity) || 0, type: d.type } : r,
                  ),
                )
              }
              onDelete={(id) => setRooms((p) => p.filter((r) => r.id !== id))}
            />
          </SectionShell>
        )}

        {section === "showtimes" && (
          <SectionShell title={t("admin.nav.showtimes")}>
            <CrudModule
              title={t("admin.nav.showtimes")}
              items={showtimes}
              globalQuery={globalQuery}
              searchKeys={["date", "time"]}
              filter={{
                key: "cinemaId",
                label: t("admin.nav.cinemas"),
                options: cinemasList.map((c) => ({ value: c.id, label: c.name })),
              }}
              fields={[
                {
                  key: "movieId",
                  label: "Film",
                  type: "select",
                  options: moviesList.map((m) => ({ value: m.id, label: m.title })),
                },
                {
                  key: "cinemaId",
                  label: t("admin.nav.cinemas"),
                  type: "select",
                  options: cinemasList.map((c) => ({ value: c.id, label: c.name })),
                },
                {
                  key: "roomId",
                  label: t("admin.nav.rooms"),
                  type: "select",
                  options: rooms.map((r) => ({ value: r.id, label: r.name })),
                },
                { key: "date", label: "Date" },
                { key: "time", label: "Heure" },
                { key: "price", label: "Prix", type: "number" },
              ]}
              columns={[
                { key: "movieId", label: "Film", render: (s) => movieTitle(s.movieId), className: "font-medium" },
                { key: "cinemaId", label: t("admin.nav.cinemas"), render: (s) => cinemaName(s.cinemaId), className: "text-muted-foreground" },
                { key: "date", label: "Date", render: (s) => `${s.date} · ${s.time}` },
                { key: "price", label: "Prix", render: (s) => fmtXAF(s.price), className: "text-primary font-semibold" },
              ]}
              onCreate={(d) =>
                setShowtimes((p) => [
                  { id: `st-${Date.now()}`, movieId: d.movieId, cinemaId: d.cinemaId, roomId: d.roomId, date: d.date, time: d.time, price: Number(d.price) || 0 },
                  ...p,
                ])
              }
              onUpdate={(id, d) =>
                setShowtimes((p) =>
                  p.map((s) =>
                    s.id === id ? { ...s, movieId: d.movieId, cinemaId: d.cinemaId, roomId: d.roomId, date: d.date, time: d.time, price: Number(d.price) || 0 } : s,
                  ),
                )
              }
              onDelete={(id) => setShowtimes((p) => p.filter((s) => s.id !== id))}
            />
          </SectionShell>
        )}

        {section === "bookings" && (
          <SectionShell title={t("admin.nav.bookings")}>
            <BookingsTable
              bookings={bookings}
              globalQuery={globalQuery}
              onConfirm={(b) => updateBookingStatus(b, "paid")}
              onCancel={(b) => updateBookingStatus(b, "cancelled")}
            />
          </SectionShell>
        )}

        {section === "users" && (
          <SectionShell title={t("admin.nav.users")}>
            <UsersTable profiles={profiles} globalQuery={globalQuery} onToggle={toggleUser} />
          </SectionShell>
        )}

        {section === "payments" && (
          <SectionShell title={t("admin.nav.payments")}>
            <PaymentsTable bookings={bookings} globalQuery={globalQuery} />
          </SectionShell>
        )}

        {section === "stats" && (
          <SectionShell title={t("admin.nav.stats")}>
            <StatsCharts bookings={bookings} />
          </SectionShell>
        )}

        {section === "settings" && (
          <SectionShell title={t("admin.nav.settings")}>
            <SettingsPanel />
          </SectionShell>
        )}
      </div>
    </div>
  );
}

function SectionShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold sm:text-3xl">
        <span className="text-gradient-gold">{title}</span>
      </h1>
      {children}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: typeof TrendingUp;
}) {
  return (
    <div className="glass rounded-2xl border border-border/60 p-5 transition-transform hover:-translate-y-1">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="grid size-9 place-items-center rounded-xl bg-[image:var(--gradient-gold)]">
          <Icon className="size-4 text-primary-foreground" />
        </span>
      </div>
      <p className="mt-3 font-display text-2xl font-bold">{value}</p>
    </div>
  );
}

function DashboardSection({
  bookings,
  revenue,
  moviesCount,
  usersCount,
}: {
  bookings: Booking[];
  revenue: number;
  moviesCount: number;
  usersCount: number;
}) {
  const { t } = useI18n();
  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold sm:text-3xl">
        <span className="text-gradient-gold">{t("admin.nav.dashboard")}</span>
      </h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t("admin.stat.bookings")} value={bookings.length} icon={ShoppingBag} />
        <StatCard label={t("admin.stat.revenue")} value={fmtXAF(revenue)} icon={TrendingUp} />
        <StatCard label={t("admin.stat.movies")} value={moviesCount} icon={Film} />
        <StatCard label={t("admin.stat.users")} value={usersCount} icon={Users} />
      </div>

      <StatsCharts bookings={bookings} />

      <h2 className="mb-4 mt-10 font-display text-xl font-semibold">{t("admin.recent")}</h2>
      <div className="glass overflow-x-auto rounded-2xl border border-border/60">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="p-4">{t("admin.movie")}</th>
              <th className="p-4">{t("admin.cinema")}</th>
              <th className="p-4">{t("admin.date")}</th>
              <th className="p-4">{t("admin.status")}</th>
              <th className="p-4 text-right">{t("admin.amount")}</th>
            </tr>
          </thead>
          <tbody>
            {bookings.slice(0, 8).map((b) => (
              <tr key={b.id} className="border-b border-border/40 last:border-0">
                <td className="p-4 font-medium">{b.movie_title}</td>
                <td className="p-4 text-muted-foreground">{b.cinema_name}</td>
                <td className="p-4 text-muted-foreground">{b.show_date} · {b.showtime}</td>
                <td className="p-4">
                  <StatusBadge status={b.payment_status} />
                </td>
                <td className="p-4 text-right font-semibold text-primary">{fmtXAF(b.total_amount)}</td>
              </tr>
            ))}
            {bookings.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-muted-foreground">
                  {t("admin.empty")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "cancelled") return <Badge variant="destructive">Annulé</Badge>;
  if (status === "pending") return <Badge variant="secondary">En attente</Badge>;
  return <Badge variant="default">Payé</Badge>;
}

function StatsCharts({ bookings }: { bookings: Booking[] }) {
  const { t } = useI18n();

  const revenueByDay = useMemo(() => {
    const map = new Map<string, number>();
    bookings
      .filter((b) => b.payment_status !== "cancelled")
      .forEach((b) => {
        const day = b.created_at.slice(0, 10);
        map.set(day, (map.get(day) ?? 0) + b.total_amount);
      });
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-10)
      .map(([day, total]) => ({ day: day.slice(5), total }));
  }, [bookings]);

  const byCinema = useMemo(() => {
    const map = new Map<string, number>();
    bookings.forEach((b) => map.set(b.cinema_name, (map.get(b.cinema_name) ?? 0) + 1));
    return Array.from(map.entries()).map(([name, count]) => ({ name, count }));
  }, [bookings]);

  return (
    <div className="mt-8 grid gap-4 lg:grid-cols-2">
      <div className="glass rounded-2xl border border-border/60 p-5">
        <h3 className="mb-4 text-sm font-semibold text-muted-foreground">{t("admin.charts.revenue")}</h3>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={revenueByDay}>
            <defs>
              <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={GOLD} stopOpacity={0.5} />
                <stop offset="100%" stopColor={GOLD} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
            <XAxis dataKey="day" stroke="oklch(0.7 0.02 260)" fontSize={12} />
            <YAxis stroke="oklch(0.7 0.02 260)" fontSize={12} width={40} />
            <RTooltip
              contentStyle={{ background: "oklch(0.21 0.025 265)", border: "1px solid oklch(0.3 0.025 265)", borderRadius: 12 }}
              formatter={(v: number) => fmtXAF(v)}
            />
            <Area type="monotone" dataKey="total" stroke={GOLD} strokeWidth={2} fill="url(#g)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="glass rounded-2xl border border-border/60 p-5">
        <h3 className="mb-4 text-sm font-semibold text-muted-foreground">{t("admin.charts.bycinema")}</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={byCinema}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
            <XAxis dataKey="name" stroke="oklch(0.7 0.02 260)" fontSize={10} interval={0} angle={-15} textAnchor="end" height={50} />
            <YAxis stroke="oklch(0.7 0.02 260)" fontSize={12} width={30} allowDecimals={false} />
            <RTooltip
              contentStyle={{ background: "oklch(0.21 0.025 265)", border: "1px solid oklch(0.3 0.025 265)", borderRadius: 12 }}
            />
            <Bar dataKey="count" fill={GOLD} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function filterBookings(bookings: Booking[], q: string) {
  const s = q.toLowerCase();
  if (!s) return bookings;
  return bookings.filter(
    (b) =>
      b.movie_title.toLowerCase().includes(s) ||
      b.cinema_name.toLowerCase().includes(s) ||
      b.ticket_code.toLowerCase().includes(s) ||
      b.payment_method.toLowerCase().includes(s),
  );
}

function BookingsTable({
  bookings,
  globalQuery,
  onConfirm,
  onCancel,
}: {
  bookings: Booking[];
  globalQuery: string;
  onConfirm: (b: Booking) => void;
  onCancel: (b: Booking) => void;
}) {
  const { t } = useI18n();
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const rows = filterBookings(bookings, q || globalQuery);
  const pageCount = Math.max(1, Math.ceil(rows.length / 8));
  const cur = Math.min(page, pageCount - 1);
  const visible = rows.slice(cur * 8, cur * 8 + 8);

  return (
    <div>
      <div className="relative mb-5 max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} placeholder={t("admin.search")} className="pl-9" />
      </div>
      <div className="glass overflow-x-auto rounded-2xl border border-border/60">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="p-4">{t("admin.movie")}</th>
              <th className="p-4">{t("admin.cinema")}</th>
              <th className="p-4">{t("book.seats")}</th>
              <th className="p-4">{t("admin.status")}</th>
              <th className="p-4 text-right">{t("admin.amount")}</th>
              <th className="p-4 text-right">{t("admin.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((b) => (
              <tr key={b.id} className="border-b border-border/40 last:border-0">
                <td className="p-4 font-medium">{b.movie_title}</td>
                <td className="p-4 text-muted-foreground">{b.cinema_name}</td>
                <td className="p-4 text-muted-foreground">{b.seats.join(", ")}</td>
                <td className="p-4"><StatusBadge status={b.payment_status} /></td>
                <td className="p-4 text-right font-semibold text-primary">{fmtXAF(b.total_amount)}</td>
                <td className="p-4">
                  <div className="flex justify-end gap-2">
                    <Button size="icon" variant="ghost" onClick={() => onConfirm(b)} title={t("admin.confirm")}>
                      <CheckCircle2 className="size-4 text-primary" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => onCancel(b)} title={t("admin.cancel")}>
                      <XCircle className="size-4 text-destructive" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">{t("admin.empty")}</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {pageCount > 1 && (
        <div className="mt-4 flex items-center justify-end gap-3 text-sm">
          <span className="text-muted-foreground">{cur + 1} / {pageCount}</span>
          <Button variant="outline" size="sm" disabled={cur === 0} onClick={() => setPage(cur - 1)}>{t("admin.prev")}</Button>
          <Button variant="outline" size="sm" disabled={cur >= pageCount - 1} onClick={() => setPage(cur + 1)}>{t("admin.next")}</Button>
        </div>
      )}
    </div>
  );
}

function UsersTable({
  profiles,
  globalQuery,
  onToggle,
}: {
  profiles: Profile[];
  globalQuery: string;
  onToggle: (p: Profile) => void;
}) {
  const { t } = useI18n();
  const [q, setQ] = useState("");
  const s = (q || globalQuery).toLowerCase();
  const rows = profiles.filter(
    (p) => !s || (p.full_name ?? "").toLowerCase().includes(s) || (p.phone ?? "").toLowerCase().includes(s),
  );

  return (
    <div>
      <div className="relative mb-5 max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("admin.search")} className="pl-9" />
      </div>
      <div className="glass overflow-x-auto rounded-2xl border border-border/60">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="p-4">{t("admin.customer")}</th>
              <th className="p-4">Téléphone</th>
              <th className="p-4">{t("admin.status")}</th>
              <th className="p-4 text-right">{t("admin.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} className="border-b border-border/40 last:border-0">
                <td className="p-4 font-medium">{p.full_name ?? "—"}</td>
                <td className="p-4 text-muted-foreground">{p.phone ?? "—"}</td>
                <td className="p-4">
                  {p.disabled ? <Badge variant="destructive">Désactivé</Badge> : <Badge variant="default">Actif</Badge>}
                </td>
                <td className="p-4">
                  <div className="flex items-center justify-end gap-2">
                    <Switch checked={!p.disabled} onCheckedChange={() => onToggle(p)} />
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">{t("admin.empty")}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PaymentsTable({ bookings, globalQuery }: { bookings: Booking[]; globalQuery: string }) {
  const { t } = useI18n();
  const [q, setQ] = useState("");
  const rows = filterBookings(bookings, q || globalQuery);

  return (
    <div>
      <div className="relative mb-5 max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("admin.search")} className="pl-9" />
      </div>
      <div className="glass overflow-x-auto rounded-2xl border border-border/60">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="p-4">Référence</th>
              <th className="p-4">{t("book.payment")}</th>
              <th className="p-4">{t("admin.date")}</th>
              <th className="p-4">{t("admin.status")}</th>
              <th className="p-4 text-right">{t("admin.amount")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((b) => (
              <tr key={b.id} className="border-b border-border/40 last:border-0">
                <td className="p-4 font-mono text-xs">{b.ticket_code}</td>
                <td className="p-4 text-muted-foreground">{b.payment_method}</td>
                <td className="p-4 text-muted-foreground">{b.created_at.slice(0, 10)}</td>
                <td className="p-4"><StatusBadge status={b.payment_status} /></td>
                <td className="p-4 text-right font-semibold text-primary">{fmtXAF(b.total_amount)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">{t("admin.empty")}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SettingsPanel() {
  const [notif, setNotif] = useState(true);
  const [maint, setMaint] = useState(false);
  return (
    <div className="glass max-w-xl space-y-6 rounded-2xl border border-border/60 p-6">
      <div className="flex items-center justify-between">
        <div>
          <Label>Notifications</Label>
          <p className="text-sm text-muted-foreground">Recevoir les alertes de nouvelles réservations.</p>
        </div>
        <Switch checked={notif} onCheckedChange={(v) => { setNotif(v); toast.success("✓"); }} />
      </div>
      <div className="flex items-center justify-between">
        <div>
          <Label>Mode maintenance</Label>
          <p className="text-sm text-muted-foreground">Désactiver temporairement les réservations.</p>
        </div>
        <Switch checked={maint} onCheckedChange={(v) => { setMaint(v); toast.success("✓"); }} />
      </div>
    </div>
  );
}
