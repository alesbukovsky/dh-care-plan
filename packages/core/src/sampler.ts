import { convertData } from "./converter";
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
			},
			{
				type: "integrity",
				name: "brushing",
				isMet: false,
				relatedTo: "gum disease",
				evidencedBy: "x-ray",
				goals: [
					{
						task: "floss daily",
						doneBy: { date: "2026-08-01", relative: "by next visit" },
						interventions: ["oral hygiene education"],
						outcome: { status: "partial", note: "improving" },
					},
					{ task: "brush twice a day", outcome: { status: "unmet" } },
				],
			},
		],
	};
}

export function getTemplateSample(): Template {
	return convertData(getPlanSample());
}

export function getConfigSample(): Config {
	return DEFAULT_CONFIG;
}
