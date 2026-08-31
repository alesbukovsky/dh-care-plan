import { z } from "zod";
import { SCHEMA_BASE_URI } from "./common";

const registry = z.registry<{ id?: string }>();

const Patient = z.object({
	initials: z.string().optional(),
	dob: z.iso.date().optional(),
	chartId: z.string().optional(),
});
registry.add(Patient, { id: "Patient" });

const Subjective = z.object({
	complaint: z.string().optional(),
	personal: z.string().optional(),
	medical: z.string().optional(),
	dental: z.string().optional(),
	social: z.string().optional(),
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

const Visit = z.object({
	date: z.iso.date().optional(),
	vitals: z.string().optional(),
});
registry.add(Visit, { id: "Visit" });

const Objective = z.object({
	medical: Medical.optional(),
	exams: Exams.optional(),
	restorative: Restorative.optional(),
	periodontal: Periodontal.optional(),
	radiographic: z.string().optional(),
	diagnostic: z.string().optional(),
	visits: z.array(Visit).optional(),
});
registry.add(Objective, { id: "Objective" });

const Outcome = z.object({
	status: z.enum(["met", "partial", "unmet"]).optional(),
	note: z.string().optional(),
});

export const Goal = z.object({
	task: z.string().optional(),
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

export type Goal = z.infer<typeof Goal>;

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
	isMet: z.boolean().optional(),
	relatedTo: z.string().optional(),
	evidencedBy: z.string().optional(),
	goals: z.array(Goal).optional(),
});
registry.add(Need, { id: "Need" });

export type Need = z.infer<typeof Need>;

export const NEED_TYPES = Need.shape.type.options;

export const Appointment = z.object({
	length: z.string().optional(),
	prophylaxis: z.string().optional(),
	instruction: z.string().optional(),
	recommendation: z.string().optional(),
	referral: z.string().optional(),
});
registry.add(Appointment, { id: "Appointment" });

export const Plan = z.object({
	study: z.string().optional(),
	patient: Patient.default(() => ({})),
	subjective: Subjective.default(() => ({})),
	objective: Objective.default(() => ({})),
	needs: z.array(Need).default(() => NEED_TYPES.map((type) => ({ type }))),
	appointments: z
		.object({
			interval: z.string().optional(),
			planned: z.array(Appointment).optional(),
		})
		.optional(),
});

export type Plan = z.infer<typeof Plan>;

export function getPlanSchema(): object {
	const json = z.toJSONSchema(Plan, { metadata: registry });
	return {
		$id: `${SCHEMA_BASE_URI}/plan.schema.json`,
		...json,
	};
}

export const DEFAULT_PLAN: Plan = Plan.parse({});
