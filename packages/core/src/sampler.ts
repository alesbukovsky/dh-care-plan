import { buildTemplateData } from "./renderer";
import type { Config } from "./schema/config";
import { DEFAULT_CONFIG } from "./schema/config";
import type { Plan } from "./schema/plan";
import type { Template } from "./schema/template";

export function getPlanSample(): Plan {
	return {
		patient: { initials: "J.D.", dob: "1990-01-01", chartId: "12345" },
		appointments: ["2026-07-01", "2026-08-01"],
		needs: [
			{
				type: "maintenance",
				name: "flossing",
				isMet: true,
				outcome: { status: "met" },
			},
			{
				type: "integrity",
				name: "brushing",
				isMet: false,
				relatedTo: "gum disease",
				evidencedBy: "x-ray",
				goals: [{ task: "floss daily", doneBy: "2026-08-01" }, { task: "brush twice a day" }],
				interventions: ["oral hygiene education"],
				outcome: { status: "partial", note: "improving" },
			},
		],
	};
}

export function getTemplateSample(): Template {
	return buildTemplateData(getPlanSample());
}

export function getConfigSample(): Config {
	return DEFAULT_CONFIG;
}
