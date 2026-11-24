import { redirect } from "next/navigation";
import { SemanticReviewSetting } from "@/components/staff/semantic-review-setting";
import { staffApi } from "@/lib/staff-api";
import type { StaffMe } from "@/types/staff";

export default async function StaffSettingsPage() {
  const me = await staffApi<StaffMe>("/staff-auth/me");
  if (me.staff_role !== "ADMIN") redirect("/staff");
  const setting = await staffApi<{ enabled: boolean }>("/staff/admin/settings/semantic-review");
  return <div className="staff-page">
    <header className="staff-page-header"><div>
      <span className="staff-eyebrow">Configurações globais</span>
      <h1>Revisão por IA das interpretações</h1>
      <p>Quando ativa, a IA faz uma revisão adicional das interpretações novas ou alteradas de estudantes e oportunidades.</p>
    </div></header>
    <SemanticReviewSetting initialEnabled={setting.enabled} />
  </div>;
}
