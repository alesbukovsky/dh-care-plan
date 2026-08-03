import { type Config, checkTemplate, type Plan, render } from "@dh-care-plan/core";
import { planFileName } from "./export";
import { downloadFile } from "./files";
import type { ImportIssue } from "./import";

export interface GenerateFailure {
	ok: false;
	summary: string;
	issues: ImportIssue[];
}

export type TemplateReadResult = { ok: true; template: Uint8Array } | GenerateFailure;

export interface RenderedPlan {
	ok: true;
	output: Uint8Array;
}

const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

function fail(summary: string, issues: ImportIssue[] = []): GenerateFailure {
	return { ok: false, summary, issues };
}

/** Reads a .docx template file and checks its tags against the plan schema. */
export async function readTemplateFile(file: File): Promise<TemplateReadResult> {
	let template: Uint8Array;
	try {
		template = new Uint8Array(await file.arrayBuffer());
	} catch {
		return fail(`“${file.name}” could not be read. Check the file and try again.`);
	}

	const check = checkTemplate(template);
	if (check.ok) return { ok: true, template };

	const issues = check.issues.map((issue) => ({
		field: issue.path || "The template",
		message: issue.message,
	}));

	return fail(
		`“${file.name}” is not a valid template. ${
			issues.length === 1 ? "One tag needs" : `${issues.length} tags need`
		} attention:`,
		issues,
	);
}

/** Renders the plan into the given template. Does not write anything to disk. */
export function renderPlan(
	plan: Plan,
	template: Uint8Array,
	config?: Config,
): RenderedPlan | GenerateFailure {
	const result = render(plan, template, config);
	if (!result.ok) {
		return fail("Could not generate the plan.", [{ field: "Template", message: result.message }]);
	}

	return { ok: true, output: result.output };
}

/** The name the generated plan will download as. Known ahead of generating it. */
export function generatedPlanFileName(plan: Plan): string {
	return planFileName(plan, new Date(), "docx");
}

/** Downloads a rendered plan. Where (or whether) the browser asks for a location is up to it. */
export function downloadGeneratedPlan(plan: Plan, output: Uint8Array): void {
	downloadFile(output, generatedPlanFileName(plan), DOCX_MIME);
}
