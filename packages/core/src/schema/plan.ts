import { z } from "zod";
import { SCHEMA_BASE_URI } from "./common";

const registry = z.registry<{ id?: string }>();

const Patient = z.object({
	initials: z.string(),
	dob: z.iso.date(),
	chartId: z.string(),
});
registry.add(Patient, { id: "Patient" });

const Subjective = z.object({
	complaint: z.string().optional(),
	personal: z.string().optional(),
	medical: z.string().optional(),
	dental: z.string().optional(),
	social: z.string().optional(),
	significance: z.string().optional(),
	other: z.string().optional(),
});
registry.add(Subjective, { id: "Subjective" });

const Medical = z.object({
	bmi: z.string().optional(),
	medications: z.string().optional(),
	allergies: z.string().optional(),
	diseases: z.string().optional(),
	asa: z.string().optional(),
	referrals: z.string().optional(),
});
registry.add(Medical, { id: "Medical" });

const Exams = z.object({
	findings: z.array(z.string()).optional(),
	referrals: z.string().optional(),
});
registry.add(Exams, { id: "Exams" });

const Restorative = z.object({
	caries: z.string().optional(),
	restorations: z.string().optional(),
	risk: z.string().optional(),
	occlusion: z.string().optional(),
	referrals: z.string().optional(),
});
registry.add(Restorative, { id: "Restorative" });

const Periodontal = z.object({
	gingiva: z.string().optional(),
	aap: z.string().optional(),
	debridement: z.string().optional(),
	gi: z.string().optional(),
	pi: z.string().optional(),
	referrals: z.string().optional(),
});
registry.add(Periodontal, { id: "Periodontal" });

const Objective = z.object({
	medical: Medical.optional(),
	exams: Exams.optional(),
	restorative: Restorative.optional(),
	periodontal: Periodontal.optional(),
	radiographic: z.string().optional(),
	diagnostic: z.string().optional(),
});
registry.add(Objective, { id: "Objective" });

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
	outcome: Outcome.optional(),
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
	isMet: z.boolean(),
	relatedTo: z.string().optional(),
	evidencedBy: z.string().optional(),
	goals: z.array(Goal).optional(),
});
registry.add(Need, { id: "Need" });

export const Plan = z.object({
	patient: Patient,
	appointments: z.array(z.iso.date()),
	subjective: Subjective,
	objective: Objective,
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
