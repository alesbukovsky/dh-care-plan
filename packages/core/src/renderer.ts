import { formatDate } from "./format";
import { type Config, DEFAULT_CONFIG, resolveConfig } from "./schema/config";
import { Plan } from "./schema/plan";
import type { Template } from "./schema/template";
import { createTemplater, describeTemplaterError } from "./templater";
import { type ValidationIssue, validateConfig, validateData, validateTemplate } from "./validator";

export type RenderResult =
	| { success: true; output: Uint8Array }
	| { success: false; issues: ValidationIssue[] };

function goalLabel(statementNumber: number, goalIndex: number): string {
	return `${statementNumber}${String.fromCharCode(97 + goalIndex)}`;
}

function orEmpty(value: string | undefined): string {
	return value ?? "";
}

export function buildTemplateData(plan: Plan, config: Config = DEFAULT_CONFIG): Template {
	const assessments = plan.needs.map((need) => ({
		need: need.name,
		isMet: need.isMet,
	}));

	const unmetNeeds = plan.needs.filter((need) => !need.isMet);

	const statements = unmetNeeds.map((need, needIndex) => {
		const statementNumber = needIndex + 1;
		return {
			need: config.mapping.need[need.type],
			relatedTo: orEmpty(need.relatedTo),
			evidencedBy: orEmpty(need.evidencedBy),
			goals: (need.goals ?? []).map((goal, goalIndex) => ({
				label: goalLabel(statementNumber, goalIndex),
				task: goal.task,
				doneBy: goal.doneBy ? formatDate(goal.doneBy, config.format.date) : undefined,
			})),
			interventions: need.interventions ?? [],
			outcome: {
				label: config.mapping.outcome[need.outcome.status],
				note: need.outcome.note,
			},
		};
	});

	return {
		patient: {
			...plan.patient,
			dob: formatDate(plan.patient.dob, config.format.date),
		},
		appointments: plan.appointments.map((date) => formatDate(date, config.format.date)),
		assessments,
		statements,
	};
}

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

	let config = DEFAULT_CONFIG;
	if (configInput) {
		const configCheck = validateConfig(configInput);
		if (!configCheck.valid) {
			return { success: false, issues: configCheck.issues };
		}
		config = resolveConfig(JSON.parse(new TextDecoder().decode(configInput)));
	}

	const plan = Plan.parse(JSON.parse(new TextDecoder().decode(planInput)));
	const data = buildTemplateData(plan, config);

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
