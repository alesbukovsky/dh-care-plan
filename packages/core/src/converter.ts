import { type Config, DEFAULT_CONFIG } from "./schema/config";
import type { Plan } from "./schema/plan";
import type { Template } from "./schema/template";

function orEmpty(value: string | undefined): string {
	return value ?? "";
}

export function dateStr(iso: string, pattern: string): string {
	const [year = "", month = "", day = ""] = iso.split("-");
	return pattern.replace(/YYYY|MM|DD/g, (token) => {
		switch (token) {
			case "YYYY":
				return year;
			case "MM":
				return month;
			case "DD":
				return day;
			default:
				return token;
		}
	});
}

function goalLabel(number: number, index: number): string {
	return `${number}${String.fromCharCode(97 + index)}`;
}

function goalDoneBy(
	doneBy: { date?: string; relative?: string } | undefined,
	config: Config,
): string | undefined {
	if (!doneBy) return undefined;
	const { date, relative } = doneBy;

	if (date && relative) {
		return config.format.goal.doneBy
			.replace("{date}", dateStr(date, config.format.date))
			.replace("{relative}", relative);
	}
	if (date) return dateStr(date, config.format.date);
	if (relative) return relative;
	return undefined;
}

export function convertData(plan: Plan, config: Config = DEFAULT_CONFIG): Template {
	const assessments = plan.needs.map((need) => ({
		need: config.mapping.need[need.type],
		isMet: need.isMet,
		relatedTo: need.relatedTo,
		evidencedBy: need.evidencedBy,
	}));

	const unmetNeeds = plan.needs.filter((need) => !need.isMet);

	const statements = unmetNeeds.map((need, needInx) => {
		const statementNo = needInx + 1;
		return {
			label: String(statementNo),
			need: config.mapping.need[need.type],
			relatedTo: orEmpty(need.relatedTo),
			evidencedBy: orEmpty(need.evidencedBy),
			goals: (need.goals ?? []).map((goal, goalInx) => ({
				label: goalLabel(statementNo, goalInx),
				task: goal.task,
				doneBy: goalDoneBy(goal.doneBy, config),
				interventions: goal.interventions ?? [],
				outcome: {
					label: config.mapping.outcome[goal.outcome?.status ?? "undefined"],
					note: goal.outcome?.note,
				},
			})),
		};
	});

	return {
		patient: {
			...plan.patient,
			dob: dateStr(plan.patient.dob, config.format.date),
		},
		appointments: plan.appointments
			.map((date) => dateStr(date, config.format.date))
			.join(config.format.appointment),
		assessments,
		statements,
	};
}
