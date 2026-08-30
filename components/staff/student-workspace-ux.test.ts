import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("canonical Student administration UX", () => {
  const list = readFileSync(
    new URL("./admin-users.tsx", import.meta.url),
    "utf8",
  );
  const detail = readFileSync(
    new URL("./student-workspace.tsx", import.meta.url),
    "utf8",
  );

  it("loads searchable paginated Students from the server", () => {
    expect(list).toContain("PaginatedAdminResponse<AdminStudentListItem>");
    expect(list).toContain('params.set("search", debouncedSearch)');
    expect(list).toContain('params.set("access_mode", query.accessMode)');
    expect(list).toContain("page.offset + page.limit");
    expect(list).not.toContain("JSON.stringify(item).toLowerCase()");
  });

  it("distinguishes access surfaces without creating separate profiles", () => {
    expect(list).toContain('WHATSAPP_ONLY: "Só WhatsApp"');
    expect(list).toContain('WEBSITE_ONLY: "Só site"');
    expect(list).toContain('MULTICHANNEL: "Site + WhatsApp"');
    expect(list).toContain("function resolveAccessMode");
    expect(list).toContain("function normalizePage");
  });

  it("keeps technical identifiers outside the human overview", () => {
    const overview = detail.slice(
      detail.indexOf('tab === "overview"'),
      detail.indexOf('tab === "profile"'),
    );
    expect(overview).toContain("Perfil de recomendação");
    expect(overview).toContain("Sinais e recomendações");
    expect(overview).not.toContain("student.id");
    expect(detail).toContain("Identidades técnicas");
    expect(detail).toContain("formatRelativeDate");
  });

  it("translates onboarding grade codes into human labels", () => {
    expect(detail).toContain('HIGH_SCHOOL_1: "1º ano do Ensino Médio"');
    expect(detail).toContain('GRADE_9: "9º ano do Ensino Fundamental"');
    expect(detail).toContain(
      "value: gradeLabel(text(preferences.current_grade))",
    );
  });
});
