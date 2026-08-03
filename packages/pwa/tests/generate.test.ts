import type { Plan } from "@dh-care-plan/core";
import { checkTemplate, render } from "@dh-care-plan/core";
import { afterEach, expect, test, vi } from "vitest";
import { saveFile } from "../src/files";
import {
	downloadGeneratedPlan,
	generatedPlanFileName,
	readTemplateFile,
	renderPlan,
} from "../src/generate";

vi.mock("@dh-care-plan/core", async () => {
	const actual = await vi.importActual<typeof import("@dh-care-plan/core")>("@dh-care-plan/core");
	return { ...actual, checkTemplate: vi.fn(), render: vi.fn() };
});

vi.mock("../src/files", () => ({ saveFile: vi.fn() }));

afterEach(() => {
	vi.clearAllMocks();
});

function templateFile(name = "template.docx"): File {
	return new File([new Uint8Array([1, 2, 3])], name, {
		type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	});
}

const PLAN = { patient: {}, subjective: {}, objective: {}, needs: [] } as unknown as Plan;

test("a valid template is read and returned as bytes", async () => {
	vi.mocked(checkTemplate).mockReturnValue({ ok: true });

	const result = await readTemplateFile(templateFile());

	expect(result.ok).toBe(true);
	expect(result.ok && result.template).toBeInstanceOf(Uint8Array);
});

test("an invalid template lists its tag issues", async () => {
	vi.mocked(checkTemplate).mockReturnValue({
		ok: false,
		issues: [{ path: "foo.bar", message: "not defined in Template" }],
	});

	const result = await readTemplateFile(templateFile("bad.docx"));

	if (result.ok) throw new Error("expected the read to fail");
	expect(result.summary).toContain("“bad.docx” is not a valid template");
	expect(result.issues).toEqual([{ field: "foo.bar", message: "not defined in Template" }]);
});

test("a template-level issue falls back to a generic field label", async () => {
	vi.mocked(checkTemplate).mockReturnValue({
		ok: false,
		issues: [{ path: "", message: "bad zip" }],
	});

	const result = await readTemplateFile(templateFile());

	if (result.ok) throw new Error("expected the read to fail");
	expect(result.issues).toEqual([{ field: "The template", message: "bad zip" }]);
});

test("an unreadable file is reported instead of thrown", async () => {
	const file = {
		name: "locked.docx",
		arrayBuffer: () => Promise.reject(new Error("NotReadableError")),
	} as unknown as File;

	const result = await readTemplateFile(file);

	expect(result.ok ? "" : result.summary).toBe(
		"“locked.docx” could not be read. Check the file and try again.",
	);
});

test("a successful render is returned without downloading anything", () => {
	vi.mocked(render).mockReturnValue({ ok: true, output: new Uint8Array([9, 9, 9]) });

	const result = renderPlan(PLAN, new Uint8Array([1]));

	expect(result).toEqual({ ok: true, output: new Uint8Array([9, 9, 9]) });
	expect(saveFile).not.toHaveBeenCalled();
});

test("a render failure is reported and nothing is downloaded", () => {
	vi.mocked(render).mockReturnValue({ ok: false, message: "unclosed tag" });

	const result = renderPlan(PLAN, new Uint8Array([1]));

	expect(result).toEqual({
		ok: false,
		summary: "Could not generate the plan.",
		issues: [{ field: "Template", message: "unclosed tag" }],
	});
	expect(saveFile).not.toHaveBeenCalled();
});

test("the generated plan's file name ends in .docx", () => {
	expect(generatedPlanFileName(PLAN)).toMatch(/\.docx$/);
});

test("downloading a generated plan writes it as a .docx under that name", async () => {
	await downloadGeneratedPlan(PLAN, new Uint8Array([9, 9, 9]));

	expect(saveFile).toHaveBeenCalledWith(
		new Uint8Array([9, 9, 9]),
		expect.stringMatching(/\.docx$/),
		"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
		expect.any(Array),
	);
});
