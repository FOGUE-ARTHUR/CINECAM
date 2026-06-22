export interface Cinema {
  id: string;
  name: string;
  city: string;
  address: string;
  rooms: number;
  contact: string;
  image: string;
}

export const cinemas: Cinema[] = [
  {
    id: "cinecam-akwa",
    name: "CINECAM Akwa Premium",
    city: "Douala",
    address: "Boulevard de la Liberté, Akwa, Douala",
    rooms: 6,
    contact: "+237 6 70 00 11 22",
    image:
      "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "cinecam-bonapriso",
    name: "CINECAM Bonapriso",
    city: "Douala",
    address: "Rue Joffre, Bonapriso, Douala",
    rooms: 4,
    contact: "+237 6 70 00 33 44",
    image:
      "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "cinecam-bastos",
    name: "CINECAM Bastos IMAX",
    city: "Yaoundé",
    address: "Quartier Bastos, Yaoundé",
    rooms: 8,
    contact: "+237 6 99 00 55 66",
    image:
      "https://images.unsplash.com/photo-1542204165-65bf26472b9b?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "cinecam-mvan",
    name: "CINECAM Mvan",
    city: "Yaoundé",
    address: "Carrefour Mvan, Yaoundé",
    rooms: 5,
    contact: "+237 6 99 00 77 88",
    image:
      "https://images.unsplash.com/photo-1595769816263-9b910be24d5f?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "cinecam-garoua",
    name: "CINECAM Garoua",
    city: "Garoua",
    address: "Avenue Ahmadou Ahidjo, Garoua",
    rooms: 3,
    contact: "+237 6 77 00 99 00",
    image:
      "https://images.unsplash.com/photo-1572188863110-46d457c9234d?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "cinecam-bamenda",
    name: "CINECAM Bamenda",
    city: "Bamenda",
    address: "Commercial Avenue, Bamenda",
    rooms: 3,
    contact: "+237 6 75 00 22 33",
    image:
      "https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?auto=format&fit=crop&w=1200&q=80",
  },
];

export const cities = Array.from(new Set(cinemas.map((c) => c.city)));
