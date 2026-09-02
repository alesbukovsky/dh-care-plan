import { z } from "zod";
import { SCHEMA_BASE_URI } from "./common";

const registry = z.registry<{ id?: string }>();

const Need = z.object({
	image: z.string(),
	peace: z.string(),
	integrity: z.string(),
	health: z.string(),
	comfort: z.string(),
	dentition: z.string(),
	understanding: z.string(),
	responsibility: z.string(),
	maintenance: z.string(),
});

const Outcome = z.object({
	met: z.string(),
	partial: z.string(),
	unmet: z.string(),
	undefined: z.string(),
});

const Met = z.object({
	true: z.string(),
	false: z.string(),
	undefined: z.string(),
});

const Goal = z.object({
	doneBy: z.string(),
});

const Format = z.object({
	date: z.string(),
	goal: Goal,
	visits: z.string(),
	vitals: z.string(),
});

const Mapping = z.object({
	need: Need,
	outcome: Outcome,
	met: Met,
});

export const Config = z.object({
	format: Format,
	mapping: Mapping,
});

export type Config = z.infer<typeof Config>;

export function getConfigSchema(): object {
	const json = z.toJSONSchema(Config, { metadata: registry });
	return {
		$id: `${SCHEMA_BASE_URI}/config.schema.json`,
		...json,
	};
}

export const DEFAULT_CONFIG: Config = {
	format: {
		date: "MM/DD/YYYY",
		goal: {
			doneBy: "{date} / {relative}",
		},
		visits: ", ",
		vitals: "Appointment {date}: {vitals}",
	},
	mapping: {
		need: {
			image: "Wholesome facial image",
			peace: "Freedom from anxiety / stress",
			integrity: "Skin and mucous membrane integrity of head and neck",
			health: "Protection from health risks",
			comfort: "Freedom from head and neck pain",
			dentition: "Biologically sound and functional dentition",
			understanding: "Conceptualization and understanding",
			responsibility: "Responsibility for oral health",
			maintenance: "Health maintenance",
		},
		outcome: {
			met: "Met",
			partial: "Partially met",
			unmet: "Not met",
			undefined: "TBD",
		},
		met: {
			true: "Yes",
			false: "No",
			undefined: "",
		},
	},
};
