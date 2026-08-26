import { redirect } from "next/navigation";
import { AdminUsers } from "@/components/staff/admin-users";
import { staffApi } from "@/lib/staff-api";
import type { StaffMe } from "@/types/staff";

export default async function StaffUsersPage() {
  const me = await staffApi<StaffMe>("/staff-auth/me");
  if (me.staff_role !== "ADMIN") redirect("/staff");
  const [accounts, students] = await Promise.all([
    staffApi<{ data: Parameters<typeof AdminUsers>[0]["initialAccounts"] }>("/staff/admin/accounts"),
    staffApi<{ data: Parameters<typeof AdminUsers>[0]["initialStudents"] }>("/staff/admin/students"),
  ]);
  return <div className="staff-page"><header className="staff-page-header"><div><span className="staff-eyebrow">Administração segura</span><h1>Pessoas e acessos</h1><p>Inspecione vínculos entre site e WhatsApp, desative contas de forma reversível e conceda funções staff. Preferências, merges e exclusões não ficam disponíveis aqui.</p></div></header><AdminUsers initialAccounts={accounts.data} initialStudents={students.data} /></div>;
}
