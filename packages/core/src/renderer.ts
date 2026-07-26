import { convertData } from "./converter";
import { type Config, DEFAULT_CONFIG, resolveConfig } from "./schema/config";
import { Plan } from "./schema/plan";
import { createTemplater, describeTemplaterError } from "./templater";
import { type ValidationIssue, validateConfig, validateData, validateTemplate } from "./validator";

export type RenderResult =
	| { success: true; output: Uint8Array }
	| { success: false; issues: ValidationIssue[] };

export function render(
	planInput: ArrayBuffer,
	templateInput: ArrayBuffer,
	configInput?: ArrayBuffer,
): RenderResult {
	const planCheck = validateData(planInput);
	if (!planCheck.valid) {
		return { success: false, issues: planCheck.issues };
	}

	const templateCheck = validateTemplate(templateInput);
	if (!templateCheck.valid) {
		return { success: false, issues: templateCheck.issues };
	}

	let config: Config = DEFAULT_CONFIG;
	if (configInput) {
		const configCheck = validateConfig(configInput);
		if (!configCheck.valid) {
			return { success: false, issues: configCheck.issues };
		}
		config = resolveConfig(JSON.parse(new TextDecoder().decode(configInput)));
	}

	const plan = Plan.parse(JSON.parse(new TextDecoder().decode(planInput)));
	const data = convertData(plan, config);

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
