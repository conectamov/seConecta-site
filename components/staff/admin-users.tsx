"use client";

import { useState } from "react";
import { Search, Shield, UserRoundCheck, UserRoundX } from "lucide-react";
import Link from "next/link";
import type { AdminAccount, AdminStudentListItem } from "@/types/staff-student";

type Account = AdminAccount;
type Student = AdminStudentListItem;

async function patch(path: string, body: unknown) {
  const response = await fetch(`/api/staff/admin/${path}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await response.json(); if (!response.ok) throw new Error(data.detail || "Falha na alteração"); return data;
}

export function AdminUsers({ initialAccounts, initialStudents, workspaceV2 = false }: { initialAccounts: Account[]; initialStudents: Student[]; workspaceV2?: boolean }) {
  const [tab, setTab] = useState<"students" | "accounts">("students");
  const [accounts, setAccounts] = useState(initialAccounts);
  const [students, setStudents] = useState(initialStudents);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const reason = "Atualização manual pelo workspace administrativo";
  async function role(account: Account, staff_role: Account["staff_role"]) { try { setError(""); const result = await patch(`accounts/${account.id}/role`, { staff_role, reason, ...(workspaceV2 ? { expected_updated_at: account.updated_at } : {}) }); setAccounts(items => items.map(item => item.id === account.id ? { ...item, staff_role, updated_at: result.updated_at || item.updated_at } : item)); } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível alterar a função"); } }
  async function accountStatus(account: Account) { try { setError(""); const result = await patch(`accounts/${account.id}/active`, { active: !account.is_active, reason, ...(workspaceV2 ? { expected_updated_at: account.updated_at } : {}) }); setAccounts(items => items.map(item => item.id === account.id ? { ...item, is_active: result.is_active, updated_at: result.updated_at || item.updated_at } : item)); } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível alterar a conta"); } }
  async function studentStatus(student: Student) { try { setError(""); const active = student.status !== "ACTIVE"; const result = await patch(`students/${student.id}/active`, { active, reason, ...(workspaceV2 ? { expected_updated_at: student.updated_at } : {}) }); setStudents(items => items.map(item => item.id === student.id ? { ...item, status: result.status, updated_at: result.updated_at || item.updated_at } : item)); } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível alterar o Student"); } }
  const normalized = search.toLowerCase();
  return <div>
    <div className="admin-tabs"><button className={tab === "students" ? "active" : ""} onClick={() => setTab("students")}>Students</button><button className={tab === "accounts" ? "active" : ""} onClick={() => setTab("accounts")}>Contas e equipe</button><label className="staff-search"><Search size={17} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Nome, e-mail, ID ou WhatsApp" /></label></div>
    {error && <p className="staff-form-error admin-inline-error">{error}</p>}
    {tab === "students" ? <section className="admin-card-list">{students.filter(item => JSON.stringify(item).toLowerCase().includes(normalized)).map(student => <article key={student.id}><div className="admin-user-icon"><UserRoundCheck size={20} /></div><div className="admin-user-main">{workspaceV2 ? <Link className="admin-user-name" href={`/staff/usuarios/${student.id}`}>{student.full_name || "Student sem nome"}</Link> : <strong>{student.full_name || "Student sem nome"}</strong>}<span>{student.id}</span><div>{student.identities.map(identity => <b key={`${identity.provider}-${identity.subject}`}>{identity.provider}: {identity.subject}</b>)}{student.legacy_links.map(link => <b key={`${link.type}-${link.user_id}-${link.bot_user_answer_id}`}>{link.type}</b>)}</div></div><div className="admin-card-actions"><span className={`status-pill ${student.status.toLowerCase()}`}>{student.status}</span><button className="staff-secondary-button" onClick={() => studentStatus(student)}>{student.status === "ACTIVE" ? <UserRoundX size={16} /> : <UserRoundCheck size={16} />}{student.status === "ACTIVE" ? "Desativar" : "Ativar"}</button></div></article>)}</section>
    : <section className="admin-card-list">{accounts.filter(item => JSON.stringify(item).toLowerCase().includes(normalized)).map(account => <article key={account.id}><div className="admin-user-icon"><Shield size={20} /></div><div className="admin-user-main"><strong>{account.full_name || account.username}</strong><span>{account.email}</span>{account.linked_student_id && workspaceV2 && <div><Link href={`/staff/usuarios/${account.linked_student_id}`}>Abrir Student vinculado</Link></div>}</div><div className="admin-card-actions"><select className="admin-role-select" aria-label={`Função de ${account.full_name || account.username}`} value={account.staff_role || ""} onChange={event => role(account, (event.target.value || null) as Account["staff_role"])}><option value="">Regular</option><option value="CURATOR">Curador</option><option value="ADMIN">Admin</option></select><button className="staff-secondary-button" onClick={() => accountStatus(account)}>{account.is_active ? "Desativar" : "Ativar"}</button></div></article>)}</section>}
  </div>;
}
