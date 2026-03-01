import type { GuestInvitation } from "@shared/schema";

import { getApiUrl } from "./query-client";

const API_URL = getApiUrl();

function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export interface CreateGuestInvitationPayload {
  name: string;
  email?: string;
  phone?: string;
  template: "classic" | "floral" | "modern";
  message?: string;
}

export async function createGuestInvitation(
  sessionToken: string,
  payload: CreateGuestInvitationPayload,
): Promise<GuestInvitation & { inviteUrl: string }> {
  const res = await fetch(`${API_URL}/api/couple/guest-invitations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeader(sessionToken),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || "Kunne ikke opprette invitasjon");
  }

  return res.json();
}

export async function getGuestInvitations(
  sessionToken: string,
): Promise<Array<GuestInvitation & { inviteUrl: string }>> {
  const res = await fetch(`${API_URL}/api/couple/guest-invitations`, {
    headers: authHeader(sessionToken),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || "Kunne ikke hente invitasjoner");
  }

  return res.json();
}
