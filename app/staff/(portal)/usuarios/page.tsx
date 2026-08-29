import { redirect } from "next/navigation";
import { AdminUsers } from "@/components/staff/admin-users";
import { staffApi, staffUserWorkspaceV2Enabled } from "@/lib/staff-api";
import type { StaffMe } from "@/types/staff";
import type {
  AdminAccount,
  AdminStudentListItem,
  PaginatedAdminResponse,
} from "@/types/staff-student";

export default async function StaffUsersPage() {
  const me = await staffApi<StaffMe>("/staff-auth/me");
  if (me.staff_role !== "ADMIN") redirect("/staff");
  const [accounts, students] = await Promise.all([
    staffApi<PaginatedAdminResponse<AdminAccount>>(
      "/staff/admin/accounts?limit=25",
    ),
    staffApi<PaginatedAdminResponse<AdminStudentListItem>>(
      "/staff/admin/students?limit=25",
    ),
  ]);
  const workspaceV2 = staffUserWorkspaceV2Enabled();
  return (
    <div className="staff-page">
      <header className="staff-page-header">
        <div>
          <span className="staff-eyebrow">Administração segura</span>
          <h1>Pessoas e acessos</h1>
          <p>
            {workspaceV2
              ? "Acompanhe cada Student entre site e WhatsApp, revise seu perfil canônico e administre acessos com histórico auditável."
              : "Inspecione vínculos entre site e WhatsApp, desative contas de forma reversível e conceda funções staff. Preferências, merges e exclusões não ficam disponíveis aqui."}
          </p>
        </div>
      </header>
      <AdminUsers
        initialAccounts={accounts}
        initialStudents={students}
        workspaceV2={workspaceV2}
      />
    </div>
  );
}
