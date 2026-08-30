"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Shield,
  UserRoundCheck,
  UserRoundX,
} from "lucide-react";
import Link from "next/link";
import type {
  AdminAccount,
  AdminStudentListItem,
  PaginatedAdminResponse,
} from "@/types/staff-student";

type Tab = "students" | "accounts";
type CanonicalAccessMode = Exclude<
  AdminStudentListItem["access_mode"],
  undefined
>;
type AccessMode = "" | CanonicalAccessMode;
type StudentQuery = {
  accessMode: AccessMode;
  onboardingStatus: "" | "COMPLETE" | "INCOMPLETE";
  profileStatus: "" | "READY" | "PENDING";
  status: "" | "ACTIVE" | "DISABLED" | "MERGED";
  sort: "activity_desc" | "created_desc" | "name_asc";
};

const accessLabels: Record<CanonicalAccessMode, string> = {
  WHATSAPP_ONLY: "Só WhatsApp",
  WEBSITE_ONLY: "Só site",
  MULTICHANNEL: "Site + WhatsApp",
  NO_ACTIVE_ACCESS: "Sem acesso ativo",
};

function normalizePage<T>(
  page: PaginatedAdminResponse<T>,
  fallbackLimit = 25,
): PaginatedAdminResponse<T> {
  const legacy = page as Partial<PaginatedAdminResponse<T>> & { data?: T[] };
  const data = Array.isArray(legacy.data) ? legacy.data : [];
  const offset = Number.isFinite(legacy.offset) ? Number(legacy.offset) : 0;
  const limit = Number.isFinite(legacy.limit)
    ? Number(legacy.limit)
    : fallbackLimit;
  const total = Number.isFinite(legacy.total)
    ? Number(legacy.total)
    : data.length;
  return {
    data,
    count: Number.isFinite(legacy.count) ? Number(legacy.count) : data.length,
    total,
    offset,
    limit,
    has_next:
      typeof legacy.has_next === "boolean"
        ? legacy.has_next
        : offset + data.length < total,
  };
}

function resolveAccessMode(student: AdminStudentListItem): CanonicalAccessMode {
  if (student.access_mode) return student.access_mode;
  const hasWhatsapp = student.identities.some(
    (identity) => identity.provider === "WHATSAPP",
  );
  const hasWebsite = Boolean(student.website_accounts?.length);
  if (hasWhatsapp && hasWebsite) return "MULTICHANNEL";
  if (hasWhatsapp) return "WHATSAPP_ONLY";
  if (hasWebsite) return "WEBSITE_ONLY";
  return "NO_ACTIVE_ACCESS";
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/staff/admin/${path}`, init);
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.detail || "Falha ao carregar os dados");
  return data as T;
}

async function patch(path: string, body: unknown) {
  return request<Record<string, unknown>>(path, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function useDebounced<T>(value: T, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timeout = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timeout);
  }, [delay, value]);
  return debounced;
}

function formatDate(value?: string | null) {
  if (!value) return "Sem atividade";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Sem atividade"
    : new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
}

function Pagination({
  page,
  onPage,
  onLimit,
}: {
  page: PaginatedAdminResponse<unknown>;
  onPage: (offset: number) => void;
  onLimit: (limit: number) => void;
}) {
  const first = page.total === 0 ? 0 : page.offset + 1;
  const last = Math.min(page.offset + page.count, page.total);
  const pageNumber = Math.floor(page.offset / page.limit) + 1;
  const totalPages = Math.max(1, Math.ceil(page.total / page.limit));
  return (
    <footer className="admin-pagination">
      <span>
        {first}–{last} de {page.total}
      </span>
      <label>
        Por página
        <select
          value={page.limit}
          onChange={(event) => onLimit(Number(event.target.value))}
        >
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
      </label>
      <div>
        <button
          aria-label="Página anterior"
          disabled={page.offset === 0}
          onClick={() => onPage(Math.max(0, page.offset - page.limit))}
        >
          <ChevronLeft size={16} />
        </button>
        <span>
          Página {pageNumber} de {totalPages}
        </span>
        <button
          aria-label="Próxima página"
          disabled={!page.has_next}
          onClick={() => onPage(page.offset + page.limit)}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </footer>
  );
}

export function AdminUsers({
  initialAccounts,
  initialStudents,
  workspaceV2 = false,
}: {
  initialAccounts: PaginatedAdminResponse<AdminAccount>;
  initialStudents: PaginatedAdminResponse<AdminStudentListItem>;
  workspaceV2?: boolean;
}) {
  const [tab, setTab] = useState<Tab>("students");
  const [accounts, setAccounts] = useState(() =>
    normalizePage(initialAccounts),
  );
  const [students, setStudents] = useState(() =>
    normalizePage(initialStudents),
  );
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search.trim());
  const [studentOffset, setStudentOffset] = useState(
    initialStudents.offset || 0,
  );
  const [accountOffset, setAccountOffset] = useState(
    initialAccounts.offset || 0,
  );
  const [studentLimit, setStudentLimit] = useState(initialStudents.limit || 25);
  const [accountLimit, setAccountLimit] = useState(initialAccounts.limit || 25);
  const [staffOnly, setStaffOnly] = useState(false);
  const [query, setQuery] = useState<StudentQuery>({
    accessMode: "",
    onboardingStatus: "",
    profileStatus: "",
    status: "",
    sort: "activity_desc",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const reason = "Atualização manual pelo workspace administrativo";

  const studentParams = useMemo(() => {
    const params = new URLSearchParams({
      offset: String(studentOffset),
      limit: String(studentLimit),
      sort: query.sort,
    });
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (query.accessMode) params.set("access_mode", query.accessMode);
    if (query.onboardingStatus)
      params.set("onboarding_status", query.onboardingStatus);
    if (query.profileStatus) params.set("profile_status", query.profileStatus);
    if (query.status) params.set("status", query.status);
    return params;
  }, [debouncedSearch, query, studentLimit, studentOffset]);
  const accountParams = useMemo(() => {
    const params = new URLSearchParams({
      offset: String(accountOffset),
      limit: String(accountLimit),
    });
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (staffOnly) params.set("staff_only", "true");
    return params;
  }, [accountLimit, accountOffset, debouncedSearch, staffOnly]);

  useEffect(() => {
    setStudentOffset(0);
    setAccountOffset(0);
  }, [debouncedSearch]);
  useEffect(() => {
    if (tab !== "students") return;
    let active = true;
    setLoading(true);
    setError("");
    request<PaginatedAdminResponse<AdminStudentListItem>>(
      `students?${studentParams}`,
    )
      .then((data) => {
        if (active) setStudents(normalizePage(data, studentLimit));
      })
      .catch((cause) => {
        if (active)
          setError(
            cause instanceof Error
              ? cause.message
              : "Não foi possível carregar os Students",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [studentParams, tab]);
  useEffect(() => {
    if (tab !== "accounts") return;
    let active = true;
    setLoading(true);
    setError("");
    request<PaginatedAdminResponse<AdminAccount>>(`accounts?${accountParams}`)
      .then((data) => {
        if (active) setAccounts(normalizePage(data, accountLimit));
      })
      .catch((cause) => {
        if (active)
          setError(
            cause instanceof Error
              ? cause.message
              : "Não foi possível carregar as contas",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [accountParams, tab]);

  function updateQuery<Key extends keyof StudentQuery>(
    key: Key,
    value: StudentQuery[Key],
  ) {
    setStudentOffset(0);
    setQuery((current) => ({ ...current, [key]: value }));
  }
  async function role(
    account: AdminAccount,
    staff_role: AdminAccount["staff_role"],
  ) {
    try {
      setError("");
      const result = await patch(`accounts/${account.id}/role`, {
        staff_role,
        reason,
        ...(workspaceV2 ? { expected_updated_at: account.updated_at } : {}),
      });
      setAccounts((current) => ({
        ...current,
        data: current.data.map((item) =>
          item.id === account.id
            ? {
                ...item,
                staff_role,
                updated_at: String(result.updated_at || item.updated_at),
              }
            : item,
        ),
      }));
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível alterar a função",
      );
    }
  }
  async function accountStatus(account: AdminAccount) {
    try {
      setError("");
      const result = await patch(`accounts/${account.id}/active`, {
        active: !account.is_active,
        reason,
        ...(workspaceV2 ? { expected_updated_at: account.updated_at } : {}),
      });
      setAccounts((current) => ({
        ...current,
        data: current.data.map((item) =>
          item.id === account.id
            ? {
                ...item,
                is_active: Boolean(result.is_active),
                updated_at: String(result.updated_at || item.updated_at),
              }
            : item,
        ),
      }));
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível alterar a conta",
      );
    }
  }
  async function studentStatus(student: AdminStudentListItem) {
    try {
      setError("");
      const active = student.status !== "ACTIVE";
      const result = await patch(`students/${student.id}/active`, {
        active,
        reason,
        ...(workspaceV2 ? { expected_updated_at: student.updated_at } : {}),
      });
      setStudents((current) => ({
        ...current,
        data: current.data.map((item) =>
          item.id === student.id
            ? {
                ...item,
                status: String(result.status),
                updated_at: String(result.updated_at || item.updated_at),
              }
            : item,
        ),
      }));
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível alterar o Student",
      );
    }
  }

  return (
    <div className="admin-users-workspace">
      <div className="admin-tabs">
        <button
          className={tab === "students" ? "active" : ""}
          onClick={() => setTab("students")}
        >
          Students
        </button>
        <button
          className={tab === "accounts" ? "active" : ""}
          onClick={() => setTab("accounts")}
        >
          Contas e equipe
        </button>
        <label className="staff-search">
          <Search size={17} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Nome, e-mail, ID ou WhatsApp"
          />
        </label>
      </div>
      {tab === "students" ? (
        <div className="admin-filter-row">
          <select
            aria-label="Canal de acesso"
            value={query.accessMode}
            onChange={(event) =>
              updateQuery("accessMode", event.target.value as AccessMode)
            }
          >
            <option value="">Todos os acessos</option>
            <option value="WHATSAPP_ONLY">Só WhatsApp</option>
            <option value="WEBSITE_ONLY">Só site</option>
            <option value="MULTICHANNEL">Site + WhatsApp</option>
            <option value="NO_ACTIVE_ACCESS">Sem acesso ativo</option>
          </select>
          <select
            aria-label="Status do onboarding"
            value={query.onboardingStatus}
            onChange={(event) =>
              updateQuery(
                "onboardingStatus",
                event.target.value as StudentQuery["onboardingStatus"],
              )
            }
          >
            <option value="">Todo onboarding</option>
            <option value="COMPLETE">Completo</option>
            <option value="INCOMPLETE">Incompleto</option>
          </select>
          <select
            aria-label="Status do perfil de recomendação"
            value={query.profileStatus}
            onChange={(event) =>
              updateQuery(
                "profileStatus",
                event.target.value as StudentQuery["profileStatus"],
              )
            }
          >
            <option value="">Todo perfil</option>
            <option value="READY">Embedding pronto</option>
            <option value="PENDING">Embedding pendente</option>
          </select>
          <select
            aria-label="Status do Student"
            value={query.status}
            onChange={(event) =>
              updateQuery(
                "status",
                event.target.value as StudentQuery["status"],
              )
            }
          >
            <option value="">Todo status</option>
            <option value="ACTIVE">Ativo</option>
            <option value="DISABLED">Desativado</option>
            <option value="MERGED">Mesclado</option>
          </select>
          <select
            aria-label="Ordenação"
            value={query.sort}
            onChange={(event) =>
              updateQuery("sort", event.target.value as StudentQuery["sort"])
            }
          >
            <option value="activity_desc">Atividade recente</option>
            <option value="created_desc">Criação recente</option>
            <option value="name_asc">Nome A–Z</option>
          </select>
        </div>
      ) : (
        <div className="admin-filter-row">
          <label className="admin-checkbox-filter">
            <input
              type="checkbox"
              checked={staffOnly}
              onChange={(event) => {
                setAccountOffset(0);
                setStaffOnly(event.target.checked);
              }}
            />{" "}
            Mostrar somente equipe
          </label>
        </div>
      )}
      {error && <p className="staff-form-error admin-inline-error">{error}</p>}
      {loading && <div className="admin-loading">Atualizando resultados…</div>}
      {tab === "students" ? (
        <>
          <div className="admin-student-table" aria-busy={loading}>
            <div className="admin-table-head">
              <span>Student</span>
              <span>Acesso</span>
              <span>Perfil</span>
              <span>Atividade</span>
              <span>Status</span>
              <span>Ações</span>
            </div>
            {students.data.map((student) => {
              const accessMode = resolveAccessMode(student);
              const contact =
                student.website_accounts?.[0]?.email ||
                student.identities.find(
                  (identity) => identity.provider === "WHATSAPP",
                )?.subject ||
                "Sem contato disponível";
              return (
                <article className="admin-student-row" key={student.id}>
                  <div className="admin-student-identity">
                    <div className="admin-user-icon">
                      <UserRoundCheck size={19} />
                    </div>
                    <div>
                      <Link href={`/staff/usuarios/${student.id}`}>
                        {student.full_name || "Student sem nome"}
                      </Link>
                      <span>{contact}</span>
                      {student.organization && (
                        <small>{student.organization}</small>
                      )}
                    </div>
                  </div>
                  <div>
                    <span
                      className={`channel-pill ${accessMode.toLowerCase()}`}
                    >
                      {accessLabels[accessMode]}
                    </span>
                  </div>
                  <div className="admin-profile-state">
                    <b>
                      {student.onboarding_complete
                        ? "Onboarding completo"
                        : "Onboarding incompleto"}
                    </b>
                    <span>
                      {student.recommendation_profile_status === "READY"
                        ? "Embedding pronto"
                        : "Embedding pendente"}
                    </span>
                  </div>
                  <div className="admin-activity-state">
                    <b>
                      {student.recent_activity?.opportunity_relationships || 0}{" "}
                      oportunidades
                    </b>
                    <span>
                      {formatDate(student.recent_activity?.last_behavior_at)}
                    </span>
                  </div>
                  <div>
                    <span
                      className={`status-pill ${student.status.toLowerCase()}`}
                    >
                      {student.status === "ACTIVE"
                        ? "Ativo"
                        : student.status === "DISABLED"
                          ? "Desativado"
                          : "Mesclado"}
                    </span>
                  </div>
                  <div className="admin-row-actions">
                    <Link
                      className="staff-secondary-button"
                      href={`/staff/usuarios/${student.id}`}
                    >
                      Abrir
                    </Link>
                    <button
                      className="admin-icon-action"
                      title={
                        student.status === "ACTIVE"
                          ? "Desativar Student"
                          : "Ativar Student"
                      }
                      onClick={() => studentStatus(student)}
                    >
                      {student.status === "ACTIVE" ? (
                        <UserRoundX size={16} />
                      ) : (
                        <UserRoundCheck size={16} />
                      )}
                    </button>
                  </div>
                </article>
              );
            })}
            {!students.data.length && !loading && (
              <p className="staff-empty">
                Nenhum Student encontrado com estes filtros.
              </p>
            )}
          </div>
          <Pagination
            page={students}
            onPage={setStudentOffset}
            onLimit={(value) => {
              setStudentOffset(0);
              setStudentLimit(value);
            }}
          />
        </>
      ) : (
        <>
          <section className="admin-card-list">
            {accounts.data.map((account) => (
              <article key={account.id}>
                <div className="admin-user-icon">
                  <Shield size={20} />
                </div>
                <div className="admin-user-main">
                  <strong>{account.full_name || account.username}</strong>
                  <span>{account.email}</span>
                  {account.linked_student_id && workspaceV2 && (
                    <div>
                      <Link
                        href={`/staff/usuarios/${account.linked_student_id}`}
                      >
                        Abrir Student vinculado
                      </Link>
                    </div>
                  )}
                </div>
                <div className="admin-card-actions">
                  <select
                    className="admin-role-select"
                    aria-label={`Função de ${account.full_name || account.username}`}
                    value={account.staff_role || ""}
                    onChange={(event) =>
                      role(
                        account,
                        (event.target.value ||
                          null) as AdminAccount["staff_role"],
                      )
                    }
                  >
                    <option value="">Regular</option>
                    <option value="CURATOR">Curador</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                  <button
                    className="staff-secondary-button"
                    onClick={() => accountStatus(account)}
                  >
                    {account.is_active ? "Desativar" : "Ativar"}
                  </button>
                </div>
              </article>
            ))}
            {!accounts.data.length && !loading && (
              <p className="staff-empty">Nenhuma conta encontrada.</p>
            )}
          </section>
          <Pagination
            page={accounts}
            onPage={setAccountOffset}
            onLimit={(value) => {
              setAccountOffset(0);
              setAccountLimit(value);
            }}
          />
        </>
      )}
    </div>
  );
}
