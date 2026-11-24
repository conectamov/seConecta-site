import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, expect, it, vi } from "vitest";
import StaffSettingsPage from "@/app/staff/(portal)/configuracoes/page";
import { staffApi } from "@/lib/staff-api";
import type { StaffMe } from "@/types/staff";
import { StaffShell } from "./staff-shell";

vi.mock("@/lib/staff-api", () => ({ staffApi: vi.fn() }));
vi.mock("next/navigation", () => ({
  usePathname: () => "/staff/configuracoes",
  useRouter: () => ({}),
  redirect: (path: string) => { throw new Error(`redirect ${path}`); },
}));

const curator: StaffMe = { id: "a", email: "a@example.org", full_name: null, staff_role: "CURATOR" };
const admin: StaffMe = { ...curator, staff_role: "ADMIN" };
const api = vi.mocked(staffApi);
beforeEach(() => { api.mockReset(); });

it("hides the global setting and redirects curators before reading it", async () => {
  api.mockResolvedValueOnce(curator);
  expect(renderToStaticMarkup(<StaffShell me={curator}>{null}</StaffShell>)).not.toContain("/staff/configuracoes");
  await expect(StaffSettingsPage()).rejects.toThrow("redirect /staff");
  expect(api.mock.calls).toEqual([["/staff-auth/me"]]);
});

it("shows admins the configured state from the global endpoint", async () => {
  api.mockResolvedValueOnce(admin).mockResolvedValueOnce({ enabled: true });
  expect(renderToStaticMarkup(<StaffShell me={admin}>{null}</StaffShell>)).toContain("/staff/configuracoes");
  const html = renderToStaticMarkup(await StaffSettingsPage());
  expect(api.mock.calls).toEqual([["/staff-auth/me"], ["/staff/admin/settings/semantic-review"]]);
  expect(html).toMatch(/role="switch"[^>]*checked/);
});
