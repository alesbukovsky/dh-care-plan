import { type Config, DEFAULT_CONFIG } from "./schema/config";
import type { Plan } from "./schema/plan";

function orEmpty(value: string | undefined): string {
	return value ?? "";
}

export function dateStr(iso: string, pattern: string): string {
	const [year = "", month = "", day = ""] = iso.split("-");
	return pattern.replaceAll("YYYY", year).replaceAll("MM", month).replaceAll("DD", day);
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

export function convertData(plan: Plan, config: Config = DEFAULT_CONFIG) {
	// An unassessed need still lists in the assessment table, where nothing worse
	// than "not met" can be said about it, but it carries no diagnosis statement.
	const assessments = plan.needs.map((need) => ({
		need: config.mapping.need[need.type],
		isMet: need.isMet ?? false,
		relatedTo: need.relatedTo,
		evidencedBy: need.evidencedBy,
	}));

	const unmetNeeds = plan.needs.filter((need) => need.isMet === false);

	const statements = unmetNeeds.map((need, needInx) => {
		const statementNo = needInx + 1;
		return {
			label: String(statementNo),
			need: config.mapping.need[need.type],
			relatedTo: orEmpty(need.relatedTo),
			evidencedBy: orEmpty(need.evidencedBy),
			goals: (need.goals ?? []).map((goal, goalInx) => ({
				label: goalLabel(statementNo, goalInx),
				task: orEmpty(goal.task),
				doneBy: goalDoneBy(goal.doneBy, config),
				interventions: goal.interventions ?? [],
				outcome: {
					label: config.mapping.outcome[goal.outcome?.status ?? "undefined"],
					note: goal.outcome?.note,
				},
			})),
		};
	});

	const sortedVisits = (plan.objective.visits ?? [])
		.filter((visit): visit is { date: string; vitals?: string } => visit.date !== undefined)
		.toSorted((a, b) => a.date.localeCompare(b.date));

	const visits = sortedVisits
		.map((visit) => dateStr(visit.date, config.format.date))
		.join(config.format.visits);

	const vitals = sortedVisits
		.filter((visit): visit is { date: string; vitals: string } => visit.vitals !== undefined)
		.map((visit) =>
			config.format.vitals
				.replace("{date}", dateStr(visit.date, config.format.date))
				.replace("{vitals}", visit.vitals),
		);

	return {
		patient: {
			initials: orEmpty(plan.patient.initials),
			chartId: orEmpty(plan.patient.chartId),
			dob: plan.patient.dob ? dateStr(plan.patient.dob, config.format.date) : "",
		},
		visits: visits || undefined,
		subjective: plan.subjective,
		objective: {
			...plan.objective,
			medical:
				plan.objective.medical || vitals.length
					? { ...plan.objective.medical, vitals: vitals.length ? vitals : undefined }
					: plan.objective.medical,
		},
		assessments,
		statements,
		appointments: {
			interval: plan.appointments?.interval,
			planned: (plan.appointments?.planned ?? []).map((appointment, index) => ({
				...appointment,
				label: String(index + 1),
			})),
		},
	};
}
