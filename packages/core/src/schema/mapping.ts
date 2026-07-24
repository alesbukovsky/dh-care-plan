import { z } from "zod";
import { SCHEMA_BASE_URI } from "./common";

const registry = z.registry<{ id?: string }>();

const OutcomeStatus = z.object({
	met: z.string(),
	partial: z.string(),
	unmet: z.string(),
});

export const Mapping = z.object({
	outcomeStatus: OutcomeStatus,
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
	outcomeStatus: {
		met: "Met",
		partial: "Partially met",
		unmet: "Not met",
	},
};

export function resolveMapping(mapping?: Mapping): Mapping {
	return mapping ?? DEFAULT_MAPPING;
}
