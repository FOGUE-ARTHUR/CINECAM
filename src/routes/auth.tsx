import { useState } from "react";
import { createFileRoute, useNavigate, Link, useSearch } from "@tanstack/react-router";
import { toast } from "sonner";
import { Film, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { sanitizeRedirect } from "@/lib/security";
import logo from "@/assets/logo.png";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === "string" ? sanitizeRedirect(search.redirect) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Connexion — CINECAM" },
      {
        name: "description",
        content: "Connectez-vous ou créez votre compte CINECAM pour réserver vos places de cinéma.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { redirect } = useSearch({ from: "/auth" });
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  const go = () => {
    const safeTarget = sanitizeRedirect(redirect, "/");
    navigate({ to: safeTarget });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        await signUp(email, password, { full_name: fullName, phone });
        toast.success(t("book.success") ?? "Compte créé avec succès !");
        go();
      } else {
        await signIn(email, password);
        go();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Une erreur s'est produite.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    toast.error("Connexion Google non disponible en mode local.");
  };

  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
      <div className="glass relative w-full max-w-md rounded-2xl border border-border/60 p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <img src={logo} alt="CINECAM" className="h-12 w-12 object-contain" />
          <h1 className="mt-3 font-display text-2xl font-bold">
            {mode === "signin" ? t("auth.welcome") : t("auth.join")}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="name">{t("auth.fullname")}</Label>
                <Input
                  id="name"
                  autoComplete="name"
                  maxLength={120}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  placeholder="Prénom Nom"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">{t("auth.phone")}</Label>
                <Input
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  maxLength={40}
                  placeholder="+237 6 ..."
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="email">{t("auth.email")}</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              maxLength={254}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="vous@exemple.com"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">{t("auth.password")}</Label>
            <Input
              id="password"
              type="password"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={mode === "signup" ? 8 : 1}
              maxLength={128}
              placeholder="••••••••"
            />
            {mode === "signup" && (
              <p className="text-xs text-muted-foreground">
                Minimum 8 caractères, incluant au moins une lettre et un chiffre.
              </p>
            )}
          </div>
          <Button type="submit" variant="gold" className="w-full gap-2" disabled={loading}>
            {loading && <Loader2 className="size-4 animate-spin" />}
            {mode === "signin" ? t("auth.signin") : t("auth.signup")}
          </Button>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> {t("auth.or")}{" "}
          <span className="h-px flex-1 bg-border" />
        </div>

        <Button variant="glass" className="w-full gap-2" onClick={handleGoogle}>
          <Film className="size-4" /> {t("auth.google")}
        </Button>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {mode === "signin" ? t("auth.noaccount") : t("auth.haveaccount")}{" "}
          <button
            type="button"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="font-semibold text-primary hover:underline"
          >
            {mode === "signin" ? t("auth.signup") : t("auth.signin")}
          </button>
        </p>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground">
            ← {t("nav.home")}
          </Link>
        </p>
      </div>
    </div>
  );
}
