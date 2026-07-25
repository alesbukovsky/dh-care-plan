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
});

export const Mapping = z.object({
	need: Need,
	outcome: Outcome,
});

export type Mapping = z.infer<typeof Mapping>;

export function getMappingSchema(): object {
	const json = z.toJSONSchema(Mapping, { metadata: registry });
	return {
		$id: `${SCHEMA_BASE_URI}/mapping.schema.json`,
		...json,
	};
}

export const DEFAULT_MAPPING: Mapping = {
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
	},
};

export function resolveMapping(mapping?: Mapping): Mapping {
	return mapping ?? DEFAULT_MAPPING;
}
