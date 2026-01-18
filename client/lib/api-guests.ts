import type { WeddingGuest, InsertWeddingGuest, UpdateWeddingGuest } from "@shared/schema";

const API_URL = process.env.EXPO_PUBLIC_DOMAIN
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN}`
  : "http://localhost:5000";

function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export async function getGuests(sessionToken: string): Promise<WeddingGuest[]> {
  const res = await fetch(`${API_URL}/api/couple/guests`, {
    headers: authHeader(sessionToken),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || "Kunne ikke hente gjester");
  }

  return res.json();
}

export async function createGuest(
  sessionToken: string,
  payload: InsertWeddingGuest
): Promise<WeddingGuest> {
  const res = await fetch(`${API_URL}/api/couple/guests`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeader(sessionToken),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || "Kunne ikke opprett gjest");
  }

  return res.json();
}

export async function updateGuest(
  sessionToken: string,
  id: string,
  payload: UpdateWeddingGuest
): Promise<WeddingGuest> {
  const res = await fetch(`${API_URL}/api/couple/guests/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...authHeader(sessionToken),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || "Kunne ikke oppdatere gjest");
  }

  return res.json();
}

export async function deleteGuest(sessionToken: string, id: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/couple/guests/${id}`, {
    method: "DELETE",
    headers: authHeader(sessionToken),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || "Kunne ikke slette gjest");
  }
}
