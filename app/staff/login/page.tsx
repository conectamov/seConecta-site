import { redirect } from "next/navigation";
import { StaffLoginForm } from "@/components/staff/staff-login-form";
import { staffApi, staffPortalEnabled } from "@/lib/staff-api";
import type { StaffMe } from "@/types/staff";
import "../staff.css";

export default async function StaffLoginPage() {
  if (!staffPortalEnabled()) return <main className="staff-login-page"><section className="staff-disabled"><span className="staff-eyebrow">Ambiente protegido</span><h1>Portal da equipe desativado</h1><p>Ative <code>STAFF_PORTAL_ENABLED</code> somente no ambiente preparado para curadoria.</p></section></main>;
  try { await staffApi<StaffMe>("/staff-auth/me"); redirect("/staff"); } catch { /* show login */ }
  return <main className="staff-login-page"><StaffLoginForm /></main>;
}
