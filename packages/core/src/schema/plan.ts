import { z } from "zod";
import { SCHEMA_BASE_URI } from "./common";

const registry = z.registry<{ id?: string }>();

const Goal = z.object({
	task: z.string(),
	doneBy: z.iso.date().optional(),
});
registry.add(Goal, { id: "Goal" });

const Need = z.object({
	name: z.string(),
	isMet: z.boolean(),
	relatedTo: z.string().optional(),
	evidencedBy: z.string().optional(),
	goals: z.array(Goal).optional(),
});
registry.add(Need, { id: "Need" });

export const Plan = z.object({
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
