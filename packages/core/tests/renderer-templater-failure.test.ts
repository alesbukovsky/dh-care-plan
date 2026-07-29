import { describe, expect, mock, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getPlanSample } from "../src/sampler";
import { buildDocx } from "./helpers/docx-fixture";

/** Shaped like a real docxtemplater multi-error, so `describeTemplaterError` has something to unwrap. */
const TEMPLATER_ERROR = {
	message: "Multi error",
	properties: {
		errors: [
			{ message: "raw scope error", properties: { explanation: "Scope parser failed" } },
			{ message: "raw render error", properties: { explanation: "Tag could not be rendered" } },
		],
	},
};

/** Only throws while `armed` is set, so the second test can render normally. */
let armed = false;

// `createTemplater` now lives in the renderer itself, so the seam is docxtemplater: the
// real class is subclassed to throw on demand, leaving construction and zip output intact.
const { default: RealDocxtemplater } = await import("docxtemplater");

mock.module("docxtemplater", () => ({
	default: class extends RealDocxtemplater {
		override render(data?: Parameters<InstanceType<typeof RealDocxtemplater>["render"]>[0]) {
			// `checkTemplate` renders with no data, and it runs first in `dhplan render`.
			// Throwing there too would make the CLI fail the template check instead of the
			// render, so only a render carrying plan data is armed.
			if (armed && data !== undefined && Object.keys(data).length > 0) throw TEMPLATER_ERROR;
			return super.render(data);
		}
	},
}));

const { render } = await import("../src/renderer");
const { runCli } = await import("./cli/run-cli");

describe("render, when docxtemplater throws during the render pass", () => {
	test("reports the failure instead of throwing, and produces no output", () => {
		const docx = buildDocx("<w:p><w:r><w:t>Hello world</w:t></w:r></w:p>");

		armed = true;
		try {
			const result = render(getPlanSample(), docx);

			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.message).toBe("Scope parser failed\nTag could not be rendered");
			}
		} finally {
			armed = false;
		}
	});

	test("renders normally once the templater stops throwing", () => {
		const docx = buildDocx("<w:p><w:r><w:t>Hello world</w:t></w:r></w:p>");

		expect(render(getPlanSample(), docx).ok).toBe(true);
	});

	// The templater is only reachable from the CLI through a real render, so the
	// mocked failure is also how `dhplan render` reports one.
	test("the render command reports the failure and writes no output file", async () => {
		const dir = await mkdtemp(join(tmpdir(), "dhplan-render-failure-"));
		const planPath = join(dir, "plan.json");
		const templatePath = join(dir, "template.docx");
		const outputPath = join(dir, "out.docx");

		await Bun.write(planPath, JSON.stringify(getPlanSample()));
		await Bun.write(templatePath, buildDocx("<w:p><w:r><w:t>Hello world</w:t></w:r></w:p>"));

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
			expect(await Bun.file(outputPath).exists()).toBe(false);
		} finally {
			armed = false;
			await rm(dir, { recursive: true, force: true });
		}
	});
});
