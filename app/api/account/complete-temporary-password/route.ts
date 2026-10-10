import { NextResponse } from "next/server";

function apiBase() {
  const value = process.env.SECONNECTA_API_URL;
  if (!value) throw new Error("SECONNECTA_API_URL is not configured");
  return value.replace(/\/$/, "");
}

export async function POST(request: Request) {
  const body = await request.text();
  const response = await fetch(`${apiBase()}/api/v1/complete-temporary-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    cache: "no-store",
  });
  const data = await response.json().catch(() => ({ detail: "Não foi possível trocar a senha" }));
  return NextResponse.json(data, { status: response.status });
}
