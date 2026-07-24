import { z } from "zod";
import { SCHEMA_BASE_URI } from "./common";

const registry = z.registry<{ id?: string }>();

const Patient = z.object({
	initials: z.string(),
	dob: z.iso.date(),
	chartId: z.string(),
});
registry.add(Patient, { id: "Patient" });

const Assessment = z.object({
	need: z.string(),
	isMet: z.boolean(),
});
registry.add(Assessment, { id: "Assessment" });

const Goal = z.object({
	label: z.string(),
	task: z.string(),
	doneBy: z.iso.date().optional(),
});
registry.add(Goal, { id: "Goal" });

const Outcome = z.object({
	label: z.string(),
	note: z.string().optional(),
});

const Statement = z.object({
	need: z.string(),
	relatedTo: z.string(),
	evidencedBy: z.string(),
	goals: z.array(Goal),
	interventions: z.array(z.string()).optional(),
	outcome: Outcome,
});
registry.add(Statement, { id: "Statement" });

export const Template = z.object({
	patient: Patient,
	appointments: z.array(z.iso.date()),
	assessments: z.array(Assessment),
	statements: z.array(Statement),
});

export type Template = z.infer<typeof Template>;

export function getTemplateSchema(): object {
	const json = z.toJSONSchema(Template, { metadata: registry });
	return {
		$id: `${SCHEMA_BASE_URI}/template.schema.json`,
		...json,
	};
}
