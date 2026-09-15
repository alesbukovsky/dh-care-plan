import { z } from "zod";
import { type Migrated, type Migration, migrate } from "../migration";
import { SCHEMA_BASE_URI } from "./common";

export const CONFIG_VERSION = 1;

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

const Exists = z.object({
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
	vitals: z.string(),
	bmi: z.string(),
	patient: z.object({
		dob: z.string(),
	}),
	condition: z.object({
		medication: z.string(),
	}),
});

const Delimiter = z.object({
	visits: z.string(),
	medical: z.object({
		medications: z.string(),
		diseases: z.string(),
	}),
	condition: z.object({
		medications: z.string(),
	}),
});

const Mapping = z.object({
	need: Need,
	outcome: Outcome,
	exists: Exists,
});

export const Config = z.object({
	version: z.number().int().default(CONFIG_VERSION),
	format: Format,
	delimiter: Delimiter,
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

export const DEFAULT_CONFIG: Config = Config.parse({
	format: {
		date: "MM/DD/YYYY",
		goal: {
			doneBy: "{date} / {relative}",
		},
		vitals: "Appointment {date}: {vitals}",
		bmi: "{value} - {class}",
		patient: {
			dob: "{date} (age {age})",
		},
		condition: {
			medication: "{name} ({description})",
		},
	},
	delimiter: {
		visits: ", ",
		medical: {
			medications: ", ",
			diseases: ", ",
		},
		condition: {
			medications: ", ",
		},
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
		exists: {
			true: "Yes",
			false: "No",
			undefined: "",
		},
	},
});

const migrations: Record<number, Migration> = {};

export function migrateConfig(data: unknown): Migrated | null {
	return migrate(data, CONFIG_VERSION, migrations);
}
