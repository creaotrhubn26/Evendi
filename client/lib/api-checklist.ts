import type { ChecklistTask, CreateChecklistTask } from "@shared/schema";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000";

export async function getChecklistTasks(sessionToken: string): Promise<ChecklistTask[]> {
  const response = await fetch(`${API_URL}/api/checklist`, {
    headers: {
      "x-session-token": sessionToken,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch checklist tasks");
  }

  return response.json();
}

export async function createChecklistTask(
  sessionToken: string,
  task: CreateChecklistTask
): Promise<ChecklistTask> {
  const response = await fetch(`${API_URL}/api/checklist`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-session-token": sessionToken,
    },
    body: JSON.stringify(task),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create task");
  }

  return response.json();
}

export async function updateChecklistTask(
  sessionToken: string,
  id: string,
  updates: Partial<ChecklistTask>
): Promise<ChecklistTask> {
  const response = await fetch(`${API_URL}/api/checklist/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "x-session-token": sessionToken,
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update task");
  }

  return response.json();
}

export async function deleteChecklistTask(
  sessionToken: string,
  id: string
): Promise<void> {
  const response = await fetch(`${API_URL}/api/checklist/${id}`, {
    method: "DELETE",
    headers: {
      "x-session-token": sessionToken,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete task");
  }
}

export async function seedDefaultChecklist(sessionToken: string): Promise<ChecklistTask[]> {
  const response = await fetch(`${API_URL}/api/checklist/seed-defaults`, {
    method: "POST",
    headers: {
      "x-session-token": sessionToken,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to seed checklist");
  }

  return response.json();
}
