import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type Lang = "fr" | "en";

type Dict = Record<string, { fr: string; en: string }>;

const dict: Dict = {
  "nav.home": { fr: "Accueil", en: "Home" },
  "nav.movies": { fr: "Films", en: "Movies" },
  "nav.cinemas": { fr: "Cinémas", en: "Cinemas" },
  "nav.signin": { fr: "Connexion", en: "Sign In" },

  "common.viewall": { fr: "Voir tout", en: "View all" },
  "common.booknow": { fr: "Réserver", en: "Book Now" },
  "common.watchtrailer": { fr: "Bande-annonce", en: "Watch Trailer" },
  "common.featured": { fr: "À l'affiche", en: "Featured" },
  "common.back": { fr: "Retour", en: "Back" },
  "common.min": { fr: "min", en: "min" },

  "home.nowshowing": { fr: "À l'affiche", en: "Now Showing" },
  "home.popular": { fr: "Populaires", en: "Popular" },
  "home.comingsoon": { fr: "Prochainement", en: "Coming Soon" },
  "home.cinemas.title": {
    fr: "{n} salles premium dans {c} villes",
    en: "{n} Premium Theatres across {c} Cities",
  },
  "home.cinemas.desc": {
    fr: "De l'effervescence de Douala au cœur de Yaoundé — trouvez un CINECAM près de chez vous et profitez du spectacle avec style.",
    en: "From the buzz of Douala to the heart of Yaoundé — find a CINECAM near you and enjoy the show in style.",
  },
  "home.cinemas.cta": { fr: "Découvrir les cinémas", en: "Explore Cinemas" },

  "movies.discover": { fr: "Découvrez les", en: "Discover" },
  "movies.title": { fr: "Films", en: "Movies" },
  "movies.available": {
    fr: "{n} film(s) disponible(s)",
    en: "{n} films available",
  },
  "movies.search": { fr: "Rechercher un film...", en: "Search movies..." },
  "movies.all": { fr: "Tous", en: "All" },
  "movies.allgenres": { fr: "Tous les genres", en: "All genres" },
  "movies.none": {
    fr: "Aucun film ne correspond à votre recherche.",
    en: "No movies match your search.",
  },

  "reserve.step": { fr: "Étape", en: "Step" },
  "reserve.cinemas.title": { fr: "Choisissez votre salle", en: "Choose your cinema" },
  "reserve.cinemas.subtitle": {
    fr: "Sélectionnez le cinéma où vous souhaitez réserver, puis choisissez votre film.",
    en: "Select the cinema where you want to book, then choose your movie.",
  },
  "reserve.cinemas.cta": { fr: "Réserver ici", en: "Book here" },
  "reserve.films.title": { fr: "Films à l'affiche", en: "Now showing" },
  "reserve.films.subtitle": {
    fr: "Films projetés à {name} — choisissez-en un pour continuer.",
    en: "Movies playing at {name} — pick one to continue.",
  },
  "reserve.films.book": { fr: "Réserver", en: "Book" },
  "reserve.back.cinemas": { fr: "Retour aux salles", en: "Back to cinemas" },
  "reserve.notfound": { fr: "Cinéma introuvable", en: "Cinema not found" },


  "details.trailer": { fr: "Bande-annonce", en: "Trailer" },
  "details.showtimes": { fr: "Séances", en: "Showtimes" },
  "details.director": { fr: "Réalisateur :", en: "Director:" },
  "details.cast": { fr: "Distribution :", en: "Cast:" },
  "details.related": { fr: "Vous aimerez aussi", en: "You may also like" },
  "details.notfound": { fr: "Film introuvable", en: "Movie not found" },
  "details.backtomovies": { fr: "Retour aux films", en: "Back to movies" },
  "details.soonnote": {
    fr: "Choisissez une séance, sélectionnez vos sièges et payez avec Orange Money ou MTN MoMo.",
    en: "Pick a showtime, choose your seats and pay with Orange Money or MTN MoMo.",
  },
  "details.screens": { fr: "salles", en: "screens" },

  // Auth
  "auth.signin": { fr: "Connexion", en: "Sign In" },
  "auth.signup": { fr: "Créer un compte", en: "Create Account" },
  "auth.email": { fr: "Adresse e-mail", en: "Email address" },
  "auth.password": { fr: "Mot de passe", en: "Password" },
  "auth.fullname": { fr: "Nom complet", en: "Full name" },
  "auth.phone": { fr: "Téléphone", en: "Phone" },
  "auth.google": { fr: "Continuer avec Google", en: "Continue with Google" },
  "auth.haveaccount": { fr: "Vous avez déjà un compte ?", en: "Already have an account?" },
  "auth.noaccount": { fr: "Pas encore de compte ?", en: "Don't have an account?" },
  "auth.or": { fr: "ou", en: "or" },
  "auth.welcome": { fr: "Bon retour parmi nous", en: "Welcome back" },
  "auth.join": { fr: "Rejoignez CINECAM", en: "Join CINECAM" },
  "auth.signout": { fr: "Déconnexion", en: "Sign Out" },
  "auth.mytickets": { fr: "Mes billets", en: "My Tickets" },
  "auth.admin": { fr: "Administration", en: "Admin" },
  "auth.account": { fr: "Mon compte", en: "Account" },

  // Booking
  "book.title": { fr: "Réserver", en: "Book" },
  "book.selectcinema": { fr: "Choisir le cinéma", en: "Select cinema" },
  "book.selectdate": { fr: "Choisir la date", en: "Select date" },
  "book.selecttime": { fr: "Choisir la séance", en: "Select showtime" },
  "book.selectseats": { fr: "Choisir vos sièges", en: "Select your seats" },
  "book.screen": { fr: "ÉCRAN", en: "SCREEN" },
  "book.available": { fr: "Disponible", en: "Available" },
  "book.selected": { fr: "Sélectionné", en: "Selected" },
  "book.taken": { fr: "Occupé", en: "Taken" },
  "book.seats": { fr: "Sièges", en: "Seats" },
  "book.total": { fr: "Total", en: "Total" },
  "book.payment": { fr: "Mode de paiement", en: "Payment method" },
  "book.pay": { fr: "Payer", en: "Pay" },
  "book.processing": { fr: "Traitement...", en: "Processing..." },
  "book.signinrequired": { fr: "Connectez-vous pour réserver", en: "Sign in to book" },
  "book.success": { fr: "Réservation confirmée !", en: "Booking confirmed!" },
  "book.perseat": { fr: "/ siège", en: "/ seat" },
  "book.noseats": { fr: "Sélectionnez au moins un siège.", en: "Select at least one seat." },
  "book.vip": { fr: "VIP", en: "VIP" },
  "book.standard": { fr: "Standard", en: "Standard" },
  "book.city": { fr: "Ville", en: "City" },
  "book.room": { fr: "Salle", en: "Room" },
  "book.duration": { fr: "Durée", en: "Duration" },
  "book.classification": { fr: "Classification", en: "Rating" },
  "book.synopsis": { fr: "Synopsis", en: "Synopsis" },
  "book.summary": { fr: "Résumé de la réservation", en: "Booking summary" },
  "book.card": { fr: "Carte bancaire", en: "Bank card" },
  "book.soon": { fr: "Bientôt", en: "Soon" },
  "book.movie": { fr: "Film", en: "Movie" },
  "book.confirmed.title": { fr: "Réservation confirmée", en: "Booking confirmed" },
  "book.confirmed.subtitle": { fr: "Présentez ce QR code à l'entrée du cinéma.", en: "Show this QR code at the cinema entrance." },
  "book.confirmed.ref": { fr: "Référence du billet", en: "Ticket reference" },
  "book.confirmed.tickets": { fr: "Voir mes billets", en: "View my tickets" },
  "book.confirmed.home": { fr: "Retour à l'accueil", en: "Back to home" },

  // Tickets
  "tickets.title": { fr: "Mes billets", en: "My Tickets" },
  "tickets.empty": { fr: "Vous n'avez pas encore de billets.", en: "You don't have any tickets yet." },
  "tickets.browse": { fr: "Parcourir les films", en: "Browse movies" },
  "tickets.ref": { fr: "Référence", en: "Reference" },
  "tickets.scan": { fr: "Présentez ce QR code à l'entrée", en: "Show this QR code at the entrance" },

  // Admin
  "admin.title": { fr: "Tableau de bord", en: "Dashboard" },
  "admin.bookings": { fr: "Réservations", en: "Bookings" },
  "admin.revenue": { fr: "Recettes", en: "Revenue" },
  "admin.tickets": { fr: "Billets vendus", en: "Tickets sold" },
  "admin.recent": { fr: "Réservations récentes", en: "Recent bookings" },
  "admin.customer": { fr: "Client", en: "Customer" },
  "admin.movie": { fr: "Film", en: "Movie" },
  "admin.cinema": { fr: "Cinéma", en: "Cinema" },
  "admin.amount": { fr: "Montant", en: "Amount" },
  "admin.noaccess": { fr: "Accès réservé aux administrateurs.", en: "Admin access only." },
  "admin.nav.dashboard": { fr: "Tableau de bord", en: "Dashboard" },
  "admin.nav.movies": { fr: "Films", en: "Movies" },
  "admin.nav.cinemas": { fr: "Cinémas", en: "Cinemas" },
  "admin.nav.rooms": { fr: "Salles", en: "Rooms" },
  "admin.nav.showtimes": { fr: "Séances", en: "Showtimes" },
  "admin.nav.bookings": { fr: "Réservations", en: "Bookings" },
  "admin.nav.users": { fr: "Utilisateurs", en: "Users" },
  "admin.nav.payments": { fr: "Paiements", en: "Payments" },
  "admin.nav.stats": { fr: "Statistiques", en: "Analytics" },
  "admin.nav.settings": { fr: "Paramètres", en: "Settings" },
  "admin.stat.bookings": { fr: "Réservations", en: "Bookings" },
  "admin.stat.revenue": { fr: "Recettes", en: "Revenue" },
  "admin.stat.movies": { fr: "Films actifs", en: "Active movies" },
  "admin.stat.users": { fr: "Utilisateurs", en: "Users" },
  "admin.search": { fr: "Recherche globale...", en: "Global search..." },
  "admin.add": { fr: "Ajouter", en: "Add" },
  "admin.edit": { fr: "Modifier", en: "Edit" },
  "admin.delete": { fr: "Supprimer", en: "Delete" },
  "admin.save": { fr: "Enregistrer", en: "Save" },
  "admin.cancel": { fr: "Annuler", en: "Cancel" },
  "admin.confirm": { fr: "Confirmer", en: "Confirm" },
  "admin.actions": { fr: "Actions", en: "Actions" },
  "admin.status": { fr: "Statut", en: "Status" },
  "admin.date": { fr: "Date", en: "Date" },
  "admin.prev": { fr: "Précédent", en: "Previous" },
  "admin.next": { fr: "Suivant", en: "Next" },
  "admin.empty": { fr: "Aucun résultat", en: "No results" },
  "admin.charts.revenue": { fr: "Recettes par jour", en: "Revenue per day" },
  "admin.charts.bycinema": { fr: "Réservations par cinéma", en: "Bookings per cinema" },


  "cinemas.our": { fr: "Nos", en: "Our" },
  "cinemas.title": { fr: "Cinémas", en: "Cinemas" },
  "cinemas.subtitle": {
    fr: "{n} salles premium dans {c} villes au Cameroun.",
    en: "{n} premium theatres across {c} cities in Cameroon.",
  },

  "footer.tagline": {
    fr: "L'expérience cinéma premium partout au Cameroun. Réservez votre place, prenez votre billet, profitez du film.",
    en: "The premium cinema experience across Cameroon. Book your seat, grab your ticket, enjoy the show.",
  },
  "footer.explore": { fr: "Explorer", en: "Explore" },
  "footer.company": { fr: "Entreprise", en: "Company" },
  "footer.follow": { fr: "Suivez-nous", en: "Follow Us" },
  "footer.about": { fr: "À propos", en: "About Us" },
  "footer.contact": { fr: "Contact", en: "Contact" },
  "footer.privacy": { fr: "Confidentialité", en: "Privacy Policy" },
  "footer.terms": { fr: "Conditions d'utilisation", en: "Terms of Service" },
  "footer.rights": {
    fr: "© {y} CINECAM. Fait au Cameroun. Tous droits réservés.",
    en: "© {y} CINECAM. Made in Cameroon. All rights reserved.",
  },
};

interface I18nContext {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: keyof typeof dict, vars?: Record<string, string | number>) => string;
}

const Ctx = createContext<I18nContext | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("fr");

  useEffect(() => {
    const stored = localStorage.getItem("cinecam-lang") as Lang | null;
    if (stored === "fr" || stored === "en") setLangState(stored);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("cinecam-lang", l);
    document.documentElement.lang = l;
  };

  const t = (key: keyof typeof dict, vars?: Record<string, string | number>) => {
    let str = dict[key]?.[lang] ?? String(key);
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        str = str.replaceAll(`{${k}}`, String(v));
      }
    }
    return str;
  };

  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
