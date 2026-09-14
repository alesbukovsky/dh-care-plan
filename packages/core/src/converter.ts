import { type Config, DEFAULT_CONFIG } from "./schema/config";
import type { Plan } from "./schema/plan";

function orEmpty(value: string | undefined): string {
	return value ?? "";
}

function formatNameDescription(
	name: string | undefined,
	description: string | undefined,
	pattern: string,
): string | undefined {
	if (name && description) {
		return pattern.replace("{name}", name).replace("{description}", description);
	}
	return name ?? description;
}

export function dateStr(iso: string, pattern: string): string {
	const [year = "", month = "", day = ""] = iso.split("-");
	return pattern.replaceAll("YYYY", year).replaceAll("MM", month).replaceAll("DD", day);
}

function goalLabel(number: number, index: number): string {
	return `${number}${String.fromCharCode(97 + index)}`;
}

function existsLabel(exists: boolean | undefined, config: Config): string {
	return config.mapping.exists[String(exists) as "true" | "false" | "undefined"];
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
	// An unassessed need still lists in the justification/assessment tables, undecided, and
	// carries no diagnosis statement (that requires exists to be explicitly true).
	const justifications = plan.needs.map((need) => ({
		need: config.mapping.need[need.type],
		exists: existsLabel(need.exists, config),
		priority: need.priority,
		rationale: need.rationale,
	}));

	const assessments = plan.needs.map((need) => ({
		need: config.mapping.need[need.type],
		exists: existsLabel(need.exists, config),
		relatedTo: orEmpty(need.relatedTo),
		evidencedBy: orEmpty(need.evidencedBy),
	}));

	const existingNeeds = plan.needs.filter((need) => need.exists === true);

	const statements = existingNeeds.map((need, needInx) => {
		const statementNo = needInx + 1;
		return {
			label: String(statementNo),
			need: config.mapping.need[need.type],
			exists: existsLabel(need.exists, config),
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

	const sortedVisits = (plan.objective.vitals?.visits ?? [])
		.filter((visit): visit is { date: string; vitals?: string } => visit.date !== undefined)
		.toSorted((a, b) => a.date.localeCompare(b.date));

	const visits = sortedVisits
		.map((visit) => dateStr(visit.date, config.format.date))
		.join(config.delimiter.visits);

	const dated = sortedVisits
		.filter((visit): visit is { date: string; vitals: string } => visit.vitals !== undefined)
		.map((visit) =>
			config.format.vitals
				.replace("{date}", dateStr(visit.date, config.format.date))
				.replace("{vitals}", visit.vitals),
		);

	const undated = plan.objective.vitals?.undated;
	const vitals = undated !== undefined ? [undated, ...dated] : dated;
	const hasVitals = vitals.length > 0;

	const conditions = plan.conditions.map((condition) => ({
		description: formatNameDescription(
			condition.name,
			condition.description,
			config.format.condition.description,
		),
		medications: condition.medications
			.map((medication) =>
				formatNameDescription(
					medication.name,
					medication.description,
					config.format.condition.medication,
				),
			)
			.filter((medication): medication is string => Boolean(medication))
			.join(config.delimiter.condition.medications),
		adverse: condition.adverse,
		interactions: condition.interactions,
		modifications: condition.modifications,
		recommendations: condition.recommendations,
	}));

	const medications = plan.conditions
		.flatMap((condition) => condition.medications.map((medication) => medication.name))
		.filter((name): name is string => Boolean(name))
		.join(config.delimiter.medical.medications);

	const diseases = plan.conditions
		.map((condition) => condition.name)
		.filter((name): name is string => Boolean(name))
		.join(config.delimiter.medical.diseases);

	return {
		patient: {
			initials: orEmpty(plan.patient.initials),
			chartId: orEmpty(plan.patient.chartId),
			dob: plan.patient.dob ? dateStr(plan.patient.dob, config.format.date) : "",
		},
		visits: visits || undefined,
		subjective: plan.subjective,
		conditions,
		objective: {
			medical:
				plan.objective.medical || hasVitals || medications || diseases
					? {
							...plan.objective.medical,
							vitals: hasVitals ? vitals : undefined,
							medications: medications || undefined,
							diseases: diseases || undefined,
						}
					: plan.objective.medical,
			exams: plan.objective.exams,
			restorative: plan.objective.restorative,
			periodontal: plan.objective.periodontal,
			radiographic: plan.objective.radiographic,
			diagnostic: plan.objective.diagnostic,
		},
		justifications,
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
