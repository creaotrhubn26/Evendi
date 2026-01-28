import { useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState, useEffect } from "react";

export interface Session {
  userId?: string;
  userEmail?: string;
  sessionToken?: string;
  token?: string;
  isAuthenticated: boolean;
}

/**
 * Hook to manage user session state
 * Returns current session information and logout function
 */
export function useSession() {
  const [session, setSession] = useState<Session>({
    isAuthenticated: false,
  });

  useEffect(() => {
    // Load session from storage on mount
    const loadSession = async () => {
      try {
        const coupleSession = await AsyncStorage.getItem("couple_session");
        if (coupleSession) {
          const parsed = JSON.parse(coupleSession);
          setSession({
            userId: parsed.coupleId,
            userEmail: parsed.email,
            sessionToken: parsed.sessionToken,
            token: parsed.sessionToken,
            isAuthenticated: !!parsed.sessionToken,
          });
          return;
        }

        const vendorSession = await AsyncStorage.getItem("vendor_session");
        if (vendorSession) {
          const parsed = JSON.parse(vendorSession);
          setSession({
            userId: parsed.vendorId,
            userEmail: parsed.email,
            sessionToken: parsed.sessionToken,
            token: parsed.sessionToken,
            isAuthenticated: !!parsed.sessionToken,
          });
          return;
        }
      } catch (error) {
        console.warn("Failed to load session from storage:", error);
      }
    };

    loadSession();
  }, []);

  const logout = useCallback(async () => {
    try {
      await AsyncStorage.removeItem("couple_session");
      await AsyncStorage.removeItem("vendor_session");
      setSession({ isAuthenticated: false });
    } catch (error) {
      console.error("Failed to logout:", error);
    }
  }, []);

  return { session, logout };
}
