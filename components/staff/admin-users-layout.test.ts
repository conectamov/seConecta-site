import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("staff account role layout", () => {
  const css = readFileSync(new URL("../../app/staff/staff.css", import.meta.url), "utf8");
  const component = readFileSync(new URL("./admin-users.tsx", import.meta.url), "utf8");

  it("scopes the role selector instead of stretching every admin select", () => {
    expect(component).toContain('className="admin-role-select"');
    expect(css).toContain(".admin-role-select { width: 150px; min-width: 150px;");
    expect(css).not.toMatch(/\.admin-card-list select\s*\{[^}]*width:\s*100%/);
  });

  it("moves controls below the identity on narrow screens", () => {
    expect(component).toContain('className="admin-card-actions"');
    expect(css).toContain(".admin-card-actions { grid-column: 1 / -1; width: 100%;");
  });
});
