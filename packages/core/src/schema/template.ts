import { z } from "zod";
import { SCHEMA_BASE_URI } from "./common";

export const TEMPLATE_VERSION = 1;

const registry = z.registry<{ id?: string }>();

const Patient = z.object({
	initials: z.string().optional(),
	dob: z.string().optional(),
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
	vitals: z.array(z.string()).optional(),
	bmi: z.string().optional(),
	medications: z.string().optional(),
	allergies: z.string().optional(),
	diseases: z.string().optional(),
	asa: z.string().optional(),
	referrals: z.array(z.string()).optional(),
});
registry.add(Medical, { id: "Medical" });

const Exams = z.object({
	findings: z.string().optional(),
	referrals: z.array(z.string()).optional(),
});
registry.add(Exams, { id: "Exams" });

const Restorative = z.object({
	caries: z.string().optional(),
	restorations: z.string().optional(),
	risk: z.string().optional(),
	occlusion: z.string().optional(),
	referrals: z.array(z.string()).optional(),
});
registry.add(Restorative, { id: "Restorative" });

const Periodontal = z.object({
	gingiva: z.string().optional(),
	aap: z.string().optional(),
	debridement: z.string().optional(),
	gi: z.string().optional(),
	pi: z.string().optional(),
	referrals: z.array(z.string()).optional(),
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

const Condition = z.object({
	name: z.string().optional(),
	description: z.string().optional(),
	medications: z.string().optional(),
	adverse: z.string().optional(),
	interactions: z.string().optional(),
	modifications: z.string().optional(),
	recommendations: z.string().optional(),
});
registry.add(Condition, { id: "Condition" });

const _Need = z.object({
	need: z.string().optional(),
	exists: z.string().optional(),
});

const _Evidence = z.object({
	relatedTo: z.string().optional(),
	evidencedBy: z.string().optional(),
});

const Justification = z.object({
	..._Need.shape,
	priority: z.string().optional(),
	rationale: z.string().optional(),
});
registry.add(Justification, { id: "Justification" });

const Assessment = z.object({
	..._Need.shape,
	..._Evidence.shape,
});
registry.add(Assessment, { id: "Assessment" });

const Outcome = z.object({
	label: z.string().optional(),
	note: z.string().optional(),
});

const Goal = z.object({
	label: z.string().optional(),
	task: z.string().optional(),
	doneBy: z.string().optional(),
	interventions: z.array(z.string()).optional(),
	outcome: Outcome.optional(),
});
registry.add(Goal, { id: "Goal" });

const Statement = z.object({
	label: z.string().optional(),
	..._Need.shape,
	..._Evidence.shape,
	goals: z.array(Goal).optional(),
});
registry.add(Statement, { id: "Statement" });

export const Appointment = z.object({
	label: z.string().optional(),
	length: z.string().optional(),
	prophylaxis: z.string().optional(),
	instruction: z.string().optional(),
	recommendation: z.string().optional(),
	referral: z.string().optional(),
});
registry.add(Appointment, { id: "Appointment" });

export const Template = z.object({
	version: z.number().int().default(TEMPLATE_VERSION),
	patient: Patient.default(() => ({})),
	visits: z.string().optional(),
	subjective: Subjective.default(() => ({})),
	objective: Objective.default(() => ({})),
	conditions: z.array(Condition).default(() => []),
	justifications: z.array(Justification).default(() => []),
	assessments: z.array(Assessment).default(() => []),
	statements: z.array(Statement).default(() => []),
	appointments: z
		.object({
			interval: z.string().optional(),
			planned: z.array(Appointment).optional(),
		})
		.default(() => ({})),
});

export type Template = z.infer<typeof Template>;

export function getTemplateSchema(): object {
	const json = z.toJSONSchema(Template, { metadata: registry });
	return {
		$id: `${SCHEMA_BASE_URI}/template.schema.json`,
		...json,
	};
}
