// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { StaffOpportunityDetail } from "@/types/staff";
import { OpportunityEditor } from "./opportunity-editor";
import { SemanticReviewSetting } from "./semantic-review-setting";

const checklist = { passed: true, items: [], version: "1", requested_stage: 1 };
const initial: StaffOpportunityDetail = {
  opportunity: { id: 1, title: "Original", approved: false, category: "OTHER", categories: ["OTHER"], description: "Descrição", recommended_experience_levels: [] },
  field_options: { category: { OTHER: "Outra" }, target_subjects: { math: "Matemática" }, languages: { en: "Inglês" }, target_goals: {}, target_education_levels: {}, recommended_experience_levels: {}, delivery_mode: {}, cost_kind: {}, scholarship_availability: {}, recurrence_pattern: {}, material_type: { GUIDE: "Guia" } },
  curation: { stage: 1, publication_status: "DRAFT", recommendation_enabled: false },
  lifecycle: { status: "OPEN", reason: "", applications_close_at: null, applications_open_at: null },
  checklists: { stage_1: checklist, stage_2: { ...checklist, requested_stage: 2 } },
  preview: { action_mode: "VIEW", feed_eligible: false, feed_blockers: [] },
  materials: [], tasks: [],
};

let root: Root;
let host: HTMLDivElement;
const request = vi.fn<typeof fetch>();

function button(text: string) {
  const element = [...host.querySelectorAll("button")].find(button => button.textContent === text);
  if (!element) throw new Error(`Missing button ${text}`);
  return element;
}

async function submit(selector: string) {
  const form = host.querySelector<HTMLFormElement>(selector)!;
  await act(() => form.requestSubmit());
}

beforeEach(() => {
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal("fetch", request.mockReset());
});

afterEach(async () => {
  await act(() => root.unmount());
  host.remove();
  vi.unstubAllGlobals();
});

describe("manual opportunity drafts", () => {
  it("preserves local edits across JSON and material actions and sends them only on explicit save", async () => {
    const material = { id: "m1", title: "Guia", url: "https://example.org", material_type: "GUIDE", reviewed: true };
    request.mockImplementation(async (url, init) => {
      if (String(url).endsWith("/row")) return Response.json(initial.opportunity);
      if (String(url).endsWith("/materials")) return Response.json(material);
      if (init?.method === "PATCH") return Response.json({ ...initial, opportunity: { ...initial.opportunity, target_subjects: ["math"] } });
      return Response.json({ ...initial, materials: [material] });
    });
    await act(() => root.render(<OpportunityEditor initial={initial} isAdmin />));
    const title = host.querySelector<HTMLInputElement>('[name="title"]')!;
    await act(() => {
      title.focus();
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(title, "Título editado");
      title.dispatchEvent(new Event("input", { bubbles: true }));
      title.blur();
    });
    expect(request).not.toHaveBeenCalled();
    expect(button("Publicar Stage 1").disabled).toBe(true);
    const subject = host.querySelector<HTMLInputElement>('[name="target_subjects"]')!;
    await act(() => { subject.click(); subject.blur(); });
    expect(request).not.toHaveBeenCalled();
    expect(button("Publicar Stage 1").disabled).toBe(true);

    await act(() => button("Dados em JSON").click());
    expect(host.querySelector("pre")?.textContent).toContain("Original");
    await act(() => button("Editor").click());
    expect(subject.checked).toBe(true);
    host.querySelector<HTMLInputElement>('[name="material_title"]')!.value = material.title;
    host.querySelector<HTMLInputElement>('[name="material_url"]')!.value = material.url;
    await submit("form.material-add");
    expect(host.querySelector(".material-list")?.textContent).toContain("Guia");
    expect(subject.checked).toBe(true);
    expect(title.value).toBe("Título editado");
    expect(button("Publicar Stage 1").disabled).toBe(true);
    expect(request.mock.calls.filter(([, init]) => init?.method === "PATCH")).toHaveLength(0);

    await submit("form:has(.staff-editor-fields)");
    const patches = request.mock.calls.filter(([, init]) => init?.method === "PATCH");
    expect(patches).toHaveLength(1);
    expect(JSON.parse(String(patches[0][1]?.body)).opportunity).toMatchObject({ title: "Título editado", target_subjects: ["math"] });
    expect(button("Publicar Stage 1").disabled).toBe(false);
  });

  it("requires an explicit successful save to accept a correction with no discarded values", async () => {
    await act(() => root.render(<OpportunityEditor initial={{ ...initial, has_proposed_corrections: true }} isAdmin={false} />));
    expect(host.textContent).toContain("propõe correções");
    expect(button("Publicar Stage 1").disabled).toBe(true);
    request.mockResolvedValueOnce(Response.json({ detail: "Falha na validação." }, { status: 422 }));
    await submit("form:has(.staff-editor-fields)");
    expect(host.textContent).toContain("Falha na validação.");
    expect(button("Publicar Stage 1").disabled).toBe(true);
    request.mockResolvedValueOnce(Response.json(initial));
    await submit("form:has(.staff-editor-fields)");
    expect(host.textContent).not.toContain("propõe correções");
    expect(button("Publicar Stage 1").disabled).toBe(false);
  });
});

it("changes the global switch only after the API confirms it", async () => {
  await act(() => root.render(<SemanticReviewSetting initialEnabled={false} />));
  const toggle = host.querySelector<HTMLInputElement>('[role="switch"]')!;
  request.mockResolvedValueOnce(Response.json({}, { status: 403 }));
  await act(() => toggle.click());
  expect(toggle.checked).toBe(false);
  expect(host.textContent).toContain("Não foi possível confirmar");
  request.mockResolvedValueOnce(Response.json({ enabled: true }));
  await act(() => toggle.click());
  expect(request).toHaveBeenLastCalledWith("/api/staff/admin/settings/semantic-review", expect.objectContaining({ method: "PATCH", body: '{"enabled":true}' }));
  expect(toggle.checked).toBe(true);
});
