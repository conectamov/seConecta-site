import { notFound, redirect } from "next/navigation";
import { StudentWorkspace } from "@/components/staff/student-workspace";
import { staffApi, staffUserWorkspaceV2Enabled } from "@/lib/staff-api";
import type { StaffMe } from "@/types/staff";
import type { StudentAdminActivity, StudentAdminAudit, StudentAdminDetail } from "@/types/staff-student";

export default async function StaffStudentPage({ params }: { params: Promise<{ id: string }> }) {
  if (!staffUserWorkspaceV2Enabled()) notFound();
  const me = await staffApi<StaffMe>("/staff-auth/me");
  if (me.staff_role !== "ADMIN") redirect("/staff");
  const { id } = await params;
  const [detail, activity, audit] = await Promise.all([
    staffApi<StudentAdminDetail>(`/staff/admin/students/${id}`),
    staffApi<StudentAdminActivity>(`/staff/admin/students/${id}/activity?limit=50`),
    staffApi<StudentAdminAudit>(`/staff/admin/students/${id}/audit?limit=50`),
  ]);
  return <StudentWorkspace initialDetail={detail} activity={activity} audit={audit} />;
}
