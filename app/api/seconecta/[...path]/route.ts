import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "seconecta_student_session";
const API_ORIGIN = (process.env.SECONNECTA_API_URL ?? "http://localhost:8000").replace(/\/+$/, "");
const API_ROOT = API_ORIGIN.endsWith("/api/v1") ? API_ORIGIN : `${API_ORIGIN}/api/v1`;
type RouteContext = { params: Promise<{ path: string[] }> };

function isAllowed(path: string, method: string) {
  const exact = new Set([
    "POST student-auth/whatsapp/challenge", "POST student-auth/whatsapp/verify",
    "POST student-auth/whatsapp/link/challenge", "POST student-auth/whatsapp/link/verify",
    "GET students/me/profile", "PATCH students/me/profile", "GET students/me/preferences",
    "PATCH students/me/preferences", "GET students/me/preferences/options", "POST student-onboarding/handoffs",
    "GET catalog/opportunities", "GET students/me/opportunity-relationships",
    "POST students/me/opportunity-relationships/import", "GET students/me/recommendations",
    "POST students/me/recommendations/events", "POST session/logout",
  ]);
  if (exact.has(`${method} ${path}`)) return true;
  if (method === "GET" && /^catalog\/opportunities\/[^/]+$/.test(path)) return true;
  return /^(GET|PUT|PATCH|POST|DELETE) students\/me\/opportunity-relationships\/\d+(?:\/(?:checklist|official-visit|feedback))?$/.test(`${method} ${path}`);
}

function requiresSession(path: string) {
  return (path.startsWith("students/me/") && path !== "students/me/preferences/options") || path.startsWith("student-auth/whatsapp/link/");
}

async function proxy(request: NextRequest, context: RouteContext) {
  const path = (await context.params).path.join("/");
  const method = request.method.toUpperCase();
  if (!isAllowed(path, method)) return NextResponse.json({ detail: "Not found" }, { status: 404 });
  const cookieStore = await cookies();
  if (path === "session/logout") {
    const response = NextResponse.json({ ok: true }); response.cookies.delete(COOKIE_NAME); return response;
  }
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (requiresSession(path) && !token) return NextResponse.json({ detail: "Authentication required" }, { status: 401 });

  const target = new URL(`${API_ROOT}/${path}`); target.search = request.nextUrl.search;
  const headers = new Headers({ Accept: "application/json" });
  const contentType = request.headers.get("content-type"); if (contentType) headers.set("Content-Type", contentType);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  let upstream: Response;
  try {
    upstream = await fetch(target, { method, headers, body: method === "GET" || method === "HEAD" ? undefined : await request.arrayBuffer(), cache: "no-store" });
  } catch {
    return NextResponse.json({ detail: "O seConecta está temporariamente indisponível." }, { status: 503 });
  }
  if (path === "student-auth/whatsapp/verify" && upstream.ok) {
    const payload = await upstream.json() as { access_token: string };
    const response = NextResponse.json({ authenticated: true });
    response.cookies.set(COOKIE_NAME, payload.access_token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 60 * 60 * 24 * 7 });
    return response;
  }
  const response = new NextResponse(await upstream.arrayBuffer(), { status: upstream.status, headers: { "Content-Type": upstream.headers.get("content-type") ?? "application/json" } });
  if ((upstream.status === 401 || upstream.status === 403) && token) response.cookies.delete(COOKIE_NAME);
  return response;
}

export const dynamic = "force-dynamic";
export const GET = proxy; export const POST = proxy; export const PUT = proxy; export const PATCH = proxy; export const DELETE = proxy;
