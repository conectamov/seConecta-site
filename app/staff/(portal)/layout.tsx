import { redirect } from "next/navigation";
import { StaffShell } from "@/components/staff/staff-shell";
import { staffApi, staffPortalEnabled } from "@/lib/staff-api";
import type { StaffMe } from "@/types/staff";
import "../staff.css";
import "../staff-modal.css";
import "../staff-metrics.css";
import "../staff-tasks.css";

export default async function StaffPortalLayout({ children }: { children: React.ReactNode }) {
  if (!staffPortalEnabled()) redirect("/staff/login");
  let me: StaffMe;
  try { me = await staffApi<StaffMe>("/staff-auth/me"); } catch { redirect("/staff/login"); }
  return <StaffShell me={me}>{children}</StaffShell>;
}
