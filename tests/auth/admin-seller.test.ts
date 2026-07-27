import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { inviteSellerSchema } from "../../lib/auth/admin-seller";

describe("admin seller auth schema", () => {
  it("rifiuta campi extra nel payload invito", () => {
    const result = inviteSellerSchema.safeParse({
      firstName: "Anna",
      lastName: "Bianchi",
      email: "anna@example.com",
      role: "admin"
    });

    expect(result.success).toBe(false);
  });
});

describe("service role protection", () => {
  it("mantiene il client admin marcato come server-only", () => {
    const source = readFileSync(
      join(process.cwd(), "lib", "supabase", "admin.ts"),
      "utf8"
    );

    expect(source).toContain('import "server-only";');
  });
});
