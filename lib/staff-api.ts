import "server-only";

import { cookies } from "next/headers";

export const STAFF_COOKIE = "seconecta_staff_session";

function apiBase(): string {
  const value = process.env.SECONNECTA_API_URL;
  if (!value) throw new Error("SECONNECTA_API_URL is not configured");
  return value.replace(/\/$/, "");
}

export function staffPortalEnabled(): boolean {
  return process.env.STAFF_PORTAL_ENABLED === "true";
}

export function curationWorkflowEnabled(): boolean {
  return process.env.CURATION_WORKFLOW_ENABLED === "true";
}

export function staffUserWorkspaceV2Enabled(): boolean {
  return process.env.STAFF_USER_WORKSPACE_V2_ENABLED === "true";
}

export async function staffApi<T>(path: string, init?: RequestInit): Promise<T> {
  const token = (await cookies()).get(STAFF_COOKIE)?.value;
  if (!token) throw new Error("STAFF_UNAUTHENTICATED");
  const response = await fetch(`${apiBase()}/api/v1${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...init?.headers,
    },
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`STAFF_API_${response.status}:${body}`);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export async function backendStaffLogin(email: string, password: string) {
  const response = await fetch(`${apiBase()}/api/v1/staff-auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    cache: "no-store",
  });
  if (response.status === 409) throw new Error("PASSWORD_CHANGE_REQUIRED");
  if (!response.ok) throw new Error("Credenciais inválidas ou acesso staff desativado.");
  return response.json() as Promise<{ access_token: string }>;
}
