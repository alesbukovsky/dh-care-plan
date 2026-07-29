import { describe, expect, test, vi } from "vitest";
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
// `importActual` keeps the base class clear of the mock registry, so `super.render` reaches
// the real implementation. `doMock` rather than `mock` because it must not hoist above this.
const { default: RealDocxtemplater } =
	await vi.importActual<typeof import("docxtemplater")>("docxtemplater");

vi.doMock("docxtemplater", () => ({
	default: class extends RealDocxtemplater {
		override render(data?: Parameters<InstanceType<typeof RealDocxtemplater>["render"]>[0]) {
			// `checkTemplate` renders with no data, so throwing there too would fail the
			// template check instead of the render. Only a render carrying plan data is armed.
			if (armed && data !== undefined && Object.keys(data).length > 0) throw TEMPLATER_ERROR;
			return super.render(data);
		}
	},
}));

const { render } = await import("../src/renderer");

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
});
