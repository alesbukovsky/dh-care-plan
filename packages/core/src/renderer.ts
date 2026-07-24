import { Plan } from "./schema/plan";
import type { Template } from "./schema/template";
import { createTemplater, describeTemplaterError } from "./templater";
import { type ValidationIssue, validateData, validateTemplate } from "./validator";

export type RenderResult =
	| { success: true; output: Uint8Array }
	| { success: false; issues: ValidationIssue[] };

export function buildTemplateData(_plan: Plan): Template {
	return {};
}

export function render(planInput: ArrayBuffer, templateInput: ArrayBuffer): RenderResult {
	const planCheck = validateData(planInput);
	if (!planCheck.valid) {
		return { success: false, issues: planCheck.issues };
	}

	const templateCheck = validateTemplate(templateInput);
	if (!templateCheck.valid) {
		return { success: false, issues: templateCheck.issues };
	}

	const plan = Plan.parse(JSON.parse(new TextDecoder().decode(planInput)));
	const data = buildTemplateData(plan);

	const doc = createTemplater(templateInput);
	try {
		doc.render(data);
	} catch (error) {
		return {
			success: false,
			issues: [{ path: "", message: describeTemplaterError(error) }],
		};
	}

	return { success: true, output: doc.getZip().generate({ type: "uint8array" }) };
}
