import { cinemas } from "@/data/cinemas";
import { movies } from "@/data/movies";

export interface Room {
  id: string;
  name: string;
  cinemaId: string;
  capacity: number;
  type: string;
}

export interface Showtime {
  id: string;
  movieId: string;
  cinemaId: string;
  roomId: string;
  date: string;
  time: string;
  price: number;
}

const roomTypes = ["Standard", "VIP", "IMAX", "3D"];

export const seedRooms = (): Room[] => {
  const rooms: Room[] = [];
  cinemas.forEach((c) => {
    for (let i = 1; i <= c.rooms; i++) {
      rooms.push({
        id: `${c.id}-salle-${i}`,
        name: `Salle ${i}`,
        cinemaId: c.id,
        capacity: 80 + ((i * 37) % 140),
        type: roomTypes[(i + c.name.length) % roomTypes.length],
      });
    }
  });
  return rooms;
};

const times = ["10:00", "13:30", "16:00", "18:45", "21:30"];
const today = new Date();
const dateAt = (offset: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
};

export const seedShowtimes = (rooms: Room[]): Showtime[] => {
  const showings = movies.filter((m) => m.category !== "coming_soon");
  const list: Showtime[] = [];
  let n = 0;
  showings.forEach((m, mi) => {
    for (let day = 0; day < 3; day++) {
      const cinema = cinemas[(mi + day) % cinemas.length];
      const cinemaRooms = rooms.filter((r) => r.cinemaId === cinema.id);
      const room = cinemaRooms[(mi + day) % Math.max(cinemaRooms.length, 1)];
      list.push({
        id: `st-${n++}`,
        movieId: m.id,
        cinemaId: cinema.id,
        roomId: room?.id ?? "",
        date: dateAt(day),
        time: times[(mi + day) % times.length],
        price: room?.type === "VIP" ? 5000 : 3000,
      });
    }
  });
  return list;
};

export const fmtXAF = (n: number) => `${n.toLocaleString("fr-FR")} FCFA`;
