# Rapport d'Inspection du Projet — 23 Juin 2026

## 📊 État Général du Projet

### Structure
- **Framework**: TanStack Start + React 19 + Vite
- **Styling**: Tailwind CSS v4
- **Authentication**: Supabase (à retirer)
- **UI Components**: Radix UI + Custom shadcn/ui
- **State Management**: React Context + React Query

---

## ❌ Problèmes Détectés

### 1. **Dépendance Critique à Supabase**
**Sévérité**: 🔴 Critique

Supabase est utilisé pour:
- ✗ Authentification (sign-up, sign-in, sessions)
- ✗ Base de données (bookings, user_roles, profiles)
- ✗ Gestion des utilisateurs

**Fichiers affectés** (9 fichiers):
- `src/lib/auth.tsx` — Contexte d'auth avec Supabase
- `src/routes/auth.tsx` — Pages connexion/inscription
- `src/routes/admin.tsx` — Dashboard admin (requêtes BD)
- `src/routes/book.§id.tsx` — Création réservations
- `src/routes/tickets.tsx` — Affichage billets
- `src/integrations/supabse/` — 5 fichiers config
- `.env.local` — Variables d'environnement

**Variables env**:
```
VITE_SUPABASE_URL
VITE_SUPABASE_PROJECT_ID
VITE_SUPABASE_PUBLISHABLE_KEY
SUPABASE_URL
SUPABASE_PROJECT_ID
SUPABASE_PUBLISHABLE_KEY
```

### 2. **Faute de Frappe dans le Dossier**
**Sévérité**: 🟡 Mineur

- Dossier nommé `supabse` au lieu de `supabase`
- Chemin: `src/integrations/supabse/`
- Imports: `@/integrations/supabase/client` (correct) mais chemin sur disque incorrect

### 3. **Migrations de Base de Données Orphelines**
**Sévérité**: 🟡 Mineur

- `supabase/migration/20260619003439_07.sql`
- `supabase/migration/20260619003453_60.sql`
- `supabase/migration/20280621015500_60.sql`
- Config Supabase: `supabase/config.toml`

### 4. **Dépendances npm Obsolètes**
**Sévérité**: 🟡 Mineur

- `@supabase/supabase-js@^2.108.2` — À supprimer
- Dépendances tierces: `@supabase/auth-js`, `@supabase/postgrest-js`, `@supabase/realtime-js`, etc.

---

## 📝 Usages de Supabase par Fichier

### `src/routes/auth.tsx`
```tsx
- supabase.auth.signUp() — Inscription
- supabase.auth.signInWithPassword() — Connexion
- supabase.auth.signOut() — Déconnexion (inféré)
```

### `src/lib/auth.tsx`
```tsx
- supabase.auth.onAuthStateChange() — Écoute changement session
- supabase.auth.getSession() — Récupère session
- supabase.from("user_roles").select() — Vérifie rôle admin
```

### `src/routes/admin.tsx`
```tsx
- supabase.from("bookings").select() — Liste réservations
- supabase.from("profiles").select() — Liste profils
- supabase.from("bookings").update() — Modifie réservation
- supabase.from("rooms").select() — Gère salles
- supabase.from("showtimes").select() — Gère horaires
```

### `src/routes/book.§id.tsx`
```tsx
- supabase.from("bookings").insert() — Crée réservation
```

### `src/routes/tickets.tsx`
```tsx
- supabase.from("bookings").select() — Affiche billets de l'utilisateur
```

---

## 🔧 Actions de Correction À Faire

### ✅ Complétées
- [x] Inspection complète du projet

### 🔄 En cours
- [ ] Supprimer dossier `supabase/` (config + migrations)
- [ ] Supprimer dossier `src/integrations/supabse/`
- [ ] Retirer variables d'env Supabase
- [ ] Remplacer logique d'authentification
- [ ] Remplacer requêtes de base de données
- [ ] Retirer dépendance `@supabase/supabase-js`

---

## 📋 Dépendances à Retirer

```json
{
  "@supabase/supabase-js": "^2.108.2"
}
```

**Dépendances tierces** (parentes) qui seront aussi supprimées:
- @supabase/auth-js
- @supabase/functions-js
- @supabase/postgrest-js
- @supabase/realtime-js
- @supabase/storage-js
- @supabase/phoenix

---

## ℹ️ Recommandations Futures

Après suppression de Supabase, considérer:
1. **Alternative d'auth**: Firebase, Auth0, ou implémentation locale
2. **Alternative BD**: MongoDB, PostgreSQL (self-hosted), ou REST API
3. **Persistance local**: localStorage pour données temporaires de développement

---

**Rapport généré**: 23 Juin 2026  
**Statut**: En cours de correction
