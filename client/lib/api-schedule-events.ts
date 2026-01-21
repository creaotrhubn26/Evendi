import type { ScheduleEvent } from "@shared/schema";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000";

function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export async function getScheduleEvents(sessionToken: string): Promise<ScheduleEvent[]> {
  const res = await fetch(`${API_URL}/api/couple/schedule-events`, {
    headers: authHeader(sessionToken),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || "Kunne ikke hente kjøreplan");
  }
  return res.json();
}

export async function updateScheduleEvent(
  sessionToken: string,
  id: string,
  payload: Partial<Pick<ScheduleEvent, "time" | "title" | "icon" | "notes" | "sortOrder">>,
): Promise<ScheduleEvent> {
  const res = await fetch(`${API_URL}/api/couple/schedule-events/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeader(sessionToken) },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || "Kunne ikke oppdatere kjøreplan");
  }
  return res.json();
}

export async function createScheduleEvent(
  sessionToken: string,
  payload: { time: string; title: string; icon?: string; notes?: string },
): Promise<ScheduleEvent> {
  const res = await fetch(`${API_URL}/api/couple/schedule-events`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader(sessionToken) },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || "Kunne ikke opprette hendelse");
  }
  return res.json();
}

export async function deleteScheduleEvent(sessionToken: string, id: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/couple/schedule-events/${id}`, {
    method: "DELETE",
    headers: authHeader(sessionToken),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || "Kunne ikke slette hendelse");
  }
}