export interface CoordinatorCoupleProfile {
  id: string;
  displayName: string;
  weddingDate?: string | null;
}

export interface CoordinatorScheduleEvent {
  id: string;
  time: string;
  title: string;
  icon?: string;
}

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000";

function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export async function getCoordinatorSchedule(accessToken: string): Promise<CoordinatorScheduleEvent[]> {
  const res = await fetch(`${API_URL}/api/coordinator/schedule-events`, {
    headers: authHeader(accessToken),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || "Kunne ikke hente program");
  }
  return res.json();
}

export async function getCoordinatorCoupleProfile(accessToken: string): Promise<CoordinatorCoupleProfile> {
  const res = await fetch(`${API_URL}/api/coordinator/couple-profile`, {
    headers: authHeader(accessToken),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || "Kunne ikke hente profil");
  }
  return res.json();
}

export async function exchangeCoordinatorCode(code: string): Promise<{ token: string }> {
  const res = await fetch(`${API_URL}/api/coordinator/access-by-code`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || "Ugyldig kode");
  }
  return res.json();
}

export async function getCoordinatorSeating(accessToken: string): Promise<any> {
  const res = await fetch(`${API_URL}/api/coordinator/seating`, {
    headers: authHeader(accessToken),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || "Kunne ikke hente bordplan");
  }
  return res.json();
}