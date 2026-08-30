import { NextResponse } from "next/server";
import { backendStaffLogin, STAFF_COOKIE, staffPortalEnabled } from "@/lib/staff-api";

export async function POST(request: Request) {
  if (!staffPortalEnabled()) return NextResponse.json({ detail: "Portal desativado" }, { status: 404 });
  try {
    const { email, password } = (await request.json()) as { email?: string; password?: string };
    if (!email || !password) return NextResponse.json({ detail: "Informe e-mail e senha" }, { status: 422 });
    const { access_token } = await backendStaffLogin(email, password);
    const response = NextResponse.json({ ok: true });
    response.cookies.set(STAFF_COOKIE, access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 8,
    });
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao entrar";
    if (message === "PASSWORD_CHANGE_REQUIRED") return NextResponse.json({ detail: message }, { status: 409 });
    return NextResponse.json({ detail: message }, { status: 401 });
  }
}
