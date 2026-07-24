import { buildTemplateData } from "./renderer";
import type { Plan } from "./schema/plan";
import type { Template } from "./schema/template";

export function getPlanSample(): Plan {
	return {
		needs: [
			{ name: "flossing", isMet: true },
			{
				name: "brushing",
				isMet: false,
				relatedTo: "gum disease",
				evidencedBy: "x-ray",
				goals: [
					{ task: "floss daily", doneBy: "2026-08-01" },
					{ task: "brush twice a day" },
				],
			},
		],
	};
}

export function getTemplateSample(): Template {
	return buildTemplateData(getPlanSample());
}
