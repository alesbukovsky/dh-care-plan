import type { Need } from "./schema/plan";
import { Plan } from "./schema/plan";
import type { Template } from "./schema/template";
import { createTemplater, describeTemplaterError } from "./templater";
import { type ValidationIssue, validateData, validateTemplate } from "./validator";

const OUTCOME_STATUS_LABEL: Record<Need["outcome"]["status"], string> = {
	met: "Met",
	partial: "Partially met",
	unmet: "Not met",
};

export type RenderResult =
	| { success: true; output: Uint8Array }
	| { success: false; issues: ValidationIssue[] };

function goalLabel(statementNumber: number, goalIndex: number): string {
	return `${statementNumber}${String.fromCharCode(97 + goalIndex)}`;
}

function orEmpty(value: string | undefined): string {
	return value ?? "";
}

export function buildTemplateData(plan: Plan): Template {
	const assessments = plan.needs.map((need) => ({
		need: need.name,
		isMet: need.isMet,
	}));

	const unmetNeeds = plan.needs.filter((need) => !need.isMet);

	const statements = unmetNeeds.map((need, needIndex) => {
		const statementNumber = needIndex + 1;
		return {
			need: need.name,
			relatedTo: orEmpty(need.relatedTo),
			evidencedBy: orEmpty(need.evidencedBy),
			goals: (need.goals ?? []).map((goal, goalIndex) => ({
				label: goalLabel(statementNumber, goalIndex),
				task: goal.task,
				doneBy: goal.doneBy,
			})),
			interventions: need.interventions ?? [],
			outcome: {
				label: OUTCOME_STATUS_LABEL[need.outcome.status],
				note: need.outcome.note,
			},
		};
	});

	return {
		patient: plan.patient,
		appointments: plan.appointments,
		assessments,
		statements,
	};
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
