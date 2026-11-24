import { NextResponse } from "next/server";
import { curationWorkflowEnabled, staffApiResponse, staffPortalEnabled } from "@/lib/staff-api";

const ALLOWED_PREFIXES = ["overview", "opportunities", "materials", "tasks", "admin"];

async function proxy(request: Request, context: { params: Promise<{ path: string[] }> }) {
  if (!staffPortalEnabled()) return NextResponse.json({ detail: "Portal desativado" }, { status: 404 });
  const { path } = await context.params;
  if (!path.length || !ALLOWED_PREFIXES.includes(path[0])) return NextResponse.json({ detail: "Rota não permitida" }, { status: 404 });
  if (path[0] !== "admin" && !curationWorkflowEnabled()) return NextResponse.json({ detail: "Workflow de curadoria desativado" }, { status: 404 });
  const source = new URL(request.url);
  const target = `/staff/${path.map(encodeURIComponent).join("/")}${source.search}`;
  try {
    const body = request.method === "GET" || request.method === "HEAD" ? undefined : await request.text();
    const upstream = await staffApiResponse(target, { method: request.method, body: body || undefined });
    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: { "Content-Type": "application/json", "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha na API staff";
    const backendStatus = Number(message.match(/STAFF_API_(\d{3})/)?.[1]);
    const status = message.includes("STAFF_UNAUTHENTICATED")
      ? 401
      : Number.isInteger(backendStatus)
        ? backendStatus
        : 502;
    if (status === 422 && (path[0] === "opportunities" || path[0] === "materials")) {
      try {
        return NextResponse.json(JSON.parse(message.slice(message.indexOf(":") + 1)), { status });
      } catch { /* Plain-text upstream response. */ }
    }
    return NextResponse.json({ detail: message }, { status });
  }
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
