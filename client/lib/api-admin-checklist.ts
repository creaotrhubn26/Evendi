import type { ChecklistTask } from "@shared/schema";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000";

interface CoupleChecklistData {
  couple: {
    id: string;
    displayName: string;
    email: string;
    weddingDate: string | null;
  };
  tasks: ChecklistTask[];
}

export interface AdminChecklistItem {
  taskId: string;
  taskTitle: string;
  taskMonthsBefore: number;
  taskCategory: string;
  taskCompleted: boolean;
  taskCompletedAt: Date | null;
  taskNotes: string | null;
  taskIsDefault: boolean;
  taskSortOrder: number;
  coupleId: string;
  coupleName: string;
  coupleEmail: string;
  weddingDate: string | null;
}

export async function getAllChecklists(adminSecret: string): Promise<AdminChecklistItem[]> {
  const response = await fetch(`${API_URL}/api/admin/checklists`, {
    headers: {
      "x-admin-secret": adminSecret,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch checklists");
  }

  return response.json();
}

export async function getCoupleChecklist(
  adminSecret: string,
  coupleId: string
): Promise<CoupleChecklistData> {
  const response = await fetch(`${API_URL}/api/admin/checklists/${coupleId}`, {
    headers: {
      "x-admin-secret": adminSecret,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch couple checklist");
  }

  return response.json();
}

export async function adminUpdateChecklistTask(
  adminSecret: string,
  taskId: string,
  updates: Partial<ChecklistTask>
): Promise<ChecklistTask> {
  const response = await fetch(`${API_URL}/api/admin/checklists/${taskId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "x-admin-secret": adminSecret,
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update task");
  }

  return response.json();
}

export async function adminDeleteChecklistTask(
  adminSecret: string,
  taskId: string
): Promise<void> {
  const response = await fetch(`${API_URL}/api/admin/checklists/${taskId}`, {
    method: "DELETE",
    headers: {
      "x-admin-secret": adminSecret,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete task");
  }
}
