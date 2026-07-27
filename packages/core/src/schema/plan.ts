import { z } from "zod";
import { SCHEMA_BASE_URI } from "./common";

const registry = z.registry<{ id?: string }>();

const Patient = z.object({
	initials: z.string(),
	dob: z.iso.date(),
	chartId: z.string(),
});
registry.add(Patient, { id: "Patient" });

const Outcome = z.object({
	status: z.enum(["met", "partial", "unmet"]),
	note: z.string().optional(),
});

export const Goal = z.object({
	task: z.string(),
	doneBy: z
		.object({
			date: z.iso.date().optional(),
			relative: z.string().optional(),
		})
		.optional(),
	interventions: z.array(z.string()).optional(),
	outcome: Outcome,
});
registry.add(Goal, { id: "Goal" });

export const Need = z.object({
	type: z.enum([
		"image",
		"peace",
		"integrity",
		"health",
		"comfort",
		"dentition",
		"understanding",
		"responsibility",
		"maintenance",
	]),
	name: z.string(),
	isMet: z.boolean(),
	relatedTo: z.string().optional(),
	evidencedBy: z.string().optional(),
	goals: z.array(Goal).optional(),
});
registry.add(Need, { id: "Need" });

export const Plan = z.object({
	patient: Patient,
	appointments: z.array(z.iso.date()),
	needs: z.array(Need),
});

export type Plan = z.infer<typeof Plan>;

export function getPlanSchema(): object {
	const json = z.toJSONSchema(Plan, { metadata: registry });
	return {
		$id: `${SCHEMA_BASE_URI}/plan.schema.json`,
		...json,
	};
}
