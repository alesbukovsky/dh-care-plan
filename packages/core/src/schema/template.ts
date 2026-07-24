import { z } from "zod";
import { SCHEMA_BASE_URI } from "./common";

const registry = z.registry<{ id?: string }>();

const Assessment = z.object({
	need: z.string(),
	isMet: z.boolean(),
});
registry.add(Assessment, { id: "Assessment" });

const Goal = z.object({
	label: z.string(),
	task: z.string(),
	doneBy: z.iso.date().optional(),
});
registry.add(Goal, { id: "Goal" });

const Statement = z.object({
	need: z.string(),
	relatedTo: z.string(),
	evidencedBy: z.string(),
	goals: z.array(Goal),
});
registry.add(Statement, { id: "Statement" });

export const Template = z.object({
	assessments: z.array(Assessment),
	statements: z.array(Statement),
});

export type Template = z.infer<typeof Template>;

export function getTemplateSchema(): object {
	const json = z.toJSONSchema(Template, { metadata: registry });
	return {
		$id: `${SCHEMA_BASE_URI}/template.schema.json`,
		...json,
	};
}
