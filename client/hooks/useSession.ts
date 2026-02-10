import { useCallback, useEffect, useState } from "react";
import { clearCoupleSession, getCoupleSession } from "@/lib/storage";

interface Session {
  userId?: string;
  userEmail?: string;
  token?: string;
  sessionToken?: string;
  isAuthenticated: boolean;
}

/**
 * Hook to manage user session state
 * Returns current session information and logout function
 */
export function useSession() {
  const [session, setSession] = useState<Session>({ isAuthenticated: false });

  const loadSession = useCallback(async () => {
    const stored = await getCoupleSession();
    if (stored?.token) {
      setSession({
        token: stored.token,
        sessionToken: stored.token,
        isAuthenticated: true,
      });
      return;
    }
    setSession({ isAuthenticated: false });
  }, []);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  const logout = useCallback(async () => {
    await clearCoupleSession();
    setSession({ isAuthenticated: false });
  }, []);

  return { session, logout, refreshSession: loadSession };
}
