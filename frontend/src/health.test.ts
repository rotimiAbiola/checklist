import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const __dirname = dirname(fileURLToPath(import.meta.url));

describe("frontend health check", () => {
  it("serves valid JSON with an ok status from public/health", () => {
    const raw = readFileSync(resolve(__dirname, "../public/health"), "utf-8");
    const body = JSON.parse(raw);
    expect(body).toEqual({ status: "ok" });
  });
});
