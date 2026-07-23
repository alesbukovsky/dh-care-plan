import { z } from "zod";

const Residency = z.object({
	type: z.string().optional(),
	town: z.string().optional(),
	fluoride: z.string().optional(),
});

const History = z.object({
	medical: z.string().optional(),
	dental: z.string().optional(),
	social: z.string().optional(),
	summary: z.string().optional(),
	medications: z.array(z.string()).optional(),
	other: z.string().optional(),
});

const Patient = z.object({
	name: z.string().optional(),
	initials: z.string().optional(),
	axiumId: z.string().optional(),
	dob: z.iso.date().optional(),
	age: z.int().optional(),
	pronouns: z.string().optional(),
	birthGender: z.string().optional(),
	race: z.string().optional(),
	ethnicity: z.string().optional(),
	residency: Residency.optional(),
	regimen: z.string().optional(),
	history: History.optional(),
	appointments: z.array(z.iso.date()).optional(),
});

const Subjective = z.object({});

const Objective = z.object({});

const Assessment = z.object({});

const Assessments = z.object({
	image: Assessment,
	anxiety: Assessment,
	integrity: Assessment,
	health: Assessment,
	pain: Assessment,
	dentition: Assessment,
	understanding: Assessment,
	maintenance: Assessment,
});

export const CarePlan = z.object({
	patient: Patient,
	subjective: Subjective,
	objective: Objective,
	assessments: Assessments,
});

export type CarePlan = z.infer<typeof CarePlan>;
