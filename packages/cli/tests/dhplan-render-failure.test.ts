import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getPlanSample } from "@dh-care-plan/core";
import { describe, expect, test, vi } from "vitest";
import { buildDocx } from "./helpers/docx-fixture";
import { fileExists, writeFixture } from "./helpers/fs";

/** Only set while a test wants the render to fail, so the rest of the suite is unaffected. */
let armed = false;

// How docxtemplater failures actually surface to the CLI: Core has already unwrapped
// them into a message, so this mocks that contract rather than the templater itself.
// Everything else stays real, including the template check that runs first.
//
// `importActual` bypasses the mock registry, so `realRender` is the genuine function and
// delegating to it for unarmed calls cannot recurse back into the mock. `doMock` rather
// than `mock` because it must not hoist: it has to run after this import resolves and
// before the CLI is pulled in below.
const actual = await vi.importActual<typeof import("@dh-care-plan/core")>("@dh-care-plan/core");
const realRender = actual.render;

vi.doMock("@dh-care-plan/core", () => ({
	...actual,
	render: (...args: Parameters<typeof realRender>) =>
		armed
			? { ok: false as const, message: "Scope parser failed\nTag could not be rendered" }
			: realRender(...args),
}));

const { runCli } = await import("./run-cli");

describe("dhplan render, when Core reports a render failure", () => {
	test("reports the failure and writes no output file", async () => {
		const dir = await mkdtemp(join(tmpdir(), "dhplan-render-failure-"));
		const planPath = join(dir, "plan.json");
		const templatePath = join(dir, "template.docx");
		const outputPath = join(dir, "out.docx");

		await writeFixture(planPath, JSON.stringify(getPlanSample()));
		await writeFixture(templatePath, buildDocx("<w:p><w:r><w:t>Hello world</w:t></w:r></w:p>"));

		armed = true;
		try {
			const { stdout, stderr, exitCode } = await runCli([
				"render",
				planPath,
				templatePath,
				outputPath,
			]);

			expect(exitCode).not.toBe(0);
			expect(stdout).toBe("");
			expect(stderr).toContain("Failed to render output file");
			expect(stderr).toContain("Scope parser failed");
			expect(await fileExists(outputPath)).toBe(false);
		} finally {
			armed = false;
			await rm(dir, { recursive: true, force: true });
		}
	});
});
