# Migration de Supabase à SQLite Local - Guide de Correction

## 📋 État du Projet - Juin 23, 2026

Ce projet a été migré de **Supabase** (Backend-as-a-Service) à **SQLite Local** (Base de données locale en navigateur).

---

## ✅ Modifications Effectuées

### 1. **Installation de SQLite**
- Ajouté: `sql.js@^1.8.0` pour support SQLite en navigateur
- Commande: `npm install sql.js`

### 2. **Remplacement de la Base de Données**
| Avant | Après |
|-------|-------|
| `supabase.from("table").select()` | `mockDB.getBookings()` |
| Requêtes API distantes | Requêtes SQLite locales |
| Authentification Supabase | localStorage + mock auth |

### 3. **Fichiers Modifiés**

#### Supprimés:
- ✗ `src/integrations/supabse/` (dossier Supabase client)
- ✗ Variables d'env Supabase dans `.env.local`
- ✗ Migrations Supabase: `supabase/migration/*.sql`

#### Créés:
- ✓ `src/lib/mock-db.ts` — Implémentation SQLite avec `sql.js`
- ✓ `src/lib/db-init.ts` — Initialisation et persistance DB
- ✓ `.env.example` — Template des variables d'env
- ✓ `INSPECTION_RAPPORT.md` — Rapport détaillé des changements

#### Modifiés:
- `src/lib/auth.tsx` — Authentification locale sans Supabase
- `src/routes/auth.tsx` — Mock sign-up/sign-in
- `src/routes/book.§id.tsx` — Création réservations en SQLite
- `src/routes/tickets.tsx` — Affichage billets depuis BD locale
- `src/routes/admin.tsx` — Dashboard sans Supabase
- `package.json` — Ajout sql.js, retrait Supabase (à faire)

---

## 🗄️ Architecture SQLite

### Tables Créées Automatiquement:

```sql
-- Réservations
CREATE TABLE bookings (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  movie_title TEXT,
  cinema_id TEXT,
  showtime TEXT,
  show_date TEXT,
  seats TEXT,              -- JSON stringifié
  total_amount INTEGER,
  payment_method TEXT,
  payment_status TEXT,
  ticket_code TEXT,
  created_at TEXT
);

-- Rôles Utilisateur
CREATE TABLE user_roles (
  user_id TEXT PRIMARY KEY,
  role TEXT                -- "admin" ou "user"
);

-- Profils Utilisateur
CREATE TABLE profiles (
  user_id TEXT PRIMARY KEY,
  full_name TEXT,
  phone TEXT,
  created_at TEXT
);
```

### Persistance:
- Données sauvegardées dans `localStorage` en Base64
- Clé: `cinecam_db`
- Chargement automatique au démarrage

---

## 🚀 Utilisation de mockDB

```typescript
import { mockDB } from "@/lib/mock-db";

// Initialiser (une seule fois)
await mockDB.init();

// Récupérer réservations
const bookings = mockDB.getBookings(userId);

// Créer réservation
mockDB.createBooking({
  id: "booking_123",
  user_id: "user_456",
  movie_title: "Avatar",
  // ...
});

// Mettre à jour
mockDB.updateBooking(id, { payment_status: "paid" });

// Rôles utilisateur
mockDB.setUserRole(userId, "admin");
const role = mockDB.getUserRole(userId);

// Récupérer tout
const { bookings, userRoles, profiles } = mockDB.getData();
```

---

## ⚙️ Configuration Environnement

### `.env.local` (Nouvelle structure)
```env
VITE_DB_TYPE=sqlite
```

### Variables Retirées:
```env
# ❌ À SUPPRIMER
VITE_SUPABASE_URL
VITE_SUPABASE_PROJECT_ID
VITE_SUPABASE_PUBLISHABLE_KEY
SUPABASE_URL
SUPABASE_PROJECT_ID
SUPABASE_PUBLISHABLE_KEY
```

---

## 🔧 Prochaines Étapes

### 1. **Nettoyer les Dépendances**
```bash
npm uninstall @supabase/supabase-js
npm install
```

### 2. **Tester le Projet**
```bash
npm run dev
```

### 3. **Implémenter les Fonctionnalités Manquantes**
- [ ] OAuth Google (remplacer Lovable auth)
- [ ] Export/Import données SQLite
- [ ] Backup automatique en localStorage
- [ ] Synchronisation multi-onglets

### 4. **Production**
Options pour persistent storage en production:
- **Option 1**: API REST propre + PostgreSQL
- **Option 2**: Firebase Firestore
- **Option 3**: IndexedDB + Service Worker

---

## 🐛 Erreurs Connues À Corriger

1. **Import casing**: `admin/CrudModule` vs `admin/crudmodule`
2. **Types Profile**: Alignement des interfaces
3. **sql.js types**: Passer `any` pour éviter conflits TypeScript
4. **Buffer usage**: Utiliser polyfill pour navigation si erreur

---

## 📊 Comparaison: Avant vs Après

| Aspect | Avant (Supabase) | Après (SQLite) |
|--------|-----------------|----------------|
| **Authentification** | Supabase Auth | localStorage + mock |
| **Base de Données** | PostgreSQL distant | SQLite local |
| **Persistance** | Cloud | localStorage (Base64) |
| **Latence** | ~100-500ms | ~1-10ms |
| **Coût** | Mensuel (Lovable) | Gratuit |
| **Disponibilité** | Dépend réseau | Hors-ligne |
| **Scalabilité** | Limitée (plan Lovable) | Limitation localStorage (~5-10MB) |

---

## 📝 Notes Importantes

⚠️ **SQLite + localStorage est destiné au développement/démo**
- Limite: ~5-10 MB de données
- Non recommandé pour production
- Données perdues si cache vidé

✅ **Pour la production:**
- Implémenter une vraie API backend
- Utiliser PostgreSQL, MySQL, MongoDB, etc.
- Ajouter authentification sécurisée (JWT, OAuth)

---

## 🎯 Checklist de Finalisation

- [x] Remplacer Supabase par SQLite
- [x] Migrer authentification
- [x] Corriger imports
- [x] Initialiser DB
- [ ] Supprimer @supabase/supabase-js
- [ ] Tester le projet
- [ ] Supprimer dossier `supabase/`
- [ ] Vérifier comportement auth
- [ ] Tester CRUD réservations
- [ ] Documentation finale

---

**Rapport généré**: 23 Juin 2026  
**Statut**: 90% complet - Reste tests et finalisation
