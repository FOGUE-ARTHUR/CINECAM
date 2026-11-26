import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export interface User {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
    phone?: string;
  };
}

export interface Session {
  user: User | null;
  access_token?: string;
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthContextValue | null>(null);

// Implémentation locale de l'authentification (à remplacer par un vrai service)
const mockUsers: Record<string, { email: string; password: string; user_metadata: any }> = {};
const activeSessions: Record<string, Session> = {};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Charger la session depuis localStorage (dev only)
    const sessionId = localStorage.getItem("auth_session_id");
    if (sessionId && activeSessions[sessionId]) {
      const sess = activeSessions[sessionId];
      setSession(sess);
      setUser(sess.user);
      // Vérifier le rôle admin
      const isAdminUser = localStorage.getItem(`admin_${sess.user?.id}`) === "true";
      setIsAdmin(isAdminUser);
    }
    setLoading(false);
  }, []);

  const handleSignOut = async () => {
    const sessionId = localStorage.getItem("auth_session_id");
    if (sessionId) {
      delete activeSessions[sessionId];
      localStorage.removeItem("auth_session_id");
    }
    setSession(null);
    setUser(null);
    setIsAdmin(false);
  };

  return (
    <Ctx.Provider value={{ user, session, isAdmin, loading, signOut: handleSignOut }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export async function signUp(email: string, password: string, metadata?: any) {
  if (mockUsers[email]) {
    throw new Error("User already exists");
  }

  const userId = `user_${Date.now()}`;
  const user: User = {
    id: userId,
    email,
    user_metadata: metadata,
  };

  mockUsers[email] = { email, password, user_metadata: metadata };

  const sessionId = `session_${Date.now()}`;
  const session: Session = { user, access_token: sessionId };
  activeSessions[sessionId] = session;

  localStorage.setItem("auth_session_id", sessionId);
  localStorage.setItem(`user_${userId}`, JSON.stringify(user));

  return { user, session };
}

export async function signInWithPassword(email: string, password: string) {
  const userRecord = mockUsers[email];
  if (!userRecord || userRecord.password !== password) {
    throw new Error("Invalid email or password");
  }

  const userId = `user_${email.split("@")[0]}`;
  const user: User = {
    id: userId,
    email,
    user_metadata: userRecord.user_metadata,
  };

  const sessionId = `session_${Date.now()}`;
  const session: Session = { user, access_token: sessionId };
  activeSessions[sessionId] = session;

  localStorage.setItem("auth_session_id", sessionId);

  return { user, session };
}

export async function signOut() {
  const sessionId = localStorage.getItem("auth_session_id");
  if (sessionId) {
    delete activeSessions[sessionId];
    localStorage.removeItem("auth_session_id");
  }
}
