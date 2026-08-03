import { convertData } from "./converter";
import type { Config } from "./schema/config";
import { DEFAULT_CONFIG } from "./schema/config";
import type { Plan } from "./schema/plan";
import type { Template } from "./schema/template";

export function getPlanSample(): Plan {
	return {
		study: "case study text",
		patient: { initials: "J.D.", dob: "1990-01-01", chartId: "12345" },
		appointments: ["2026-07-01", "2026-08-01"],
		subjective: {
			complaint: "sensitive teeth",
			personal: "no relevant personal history",
			medical: "no relevant medical history",
			dental: "brushes twice daily, does not floss",
			social: "no relevant social history",
			significance: "would benefit from flossing instruction",
			other: "tolerated all procedures well",
		},
		objective: {
			medical: {
				bmi: "22.4",
				medications: "none",
				allergies: "none",
				diseases: "none",
				asa: "I",
				referrals: "none",
			},
			exams: { findings: ["no visible caries"], referrals: "none" },
			restorative: {
				caries: "none",
				restorations: "none",
				risk: "low",
				occlusion: "class I",
				referrals: "none",
			},
			periodontal: {
				gingiva: "pink and firm",
				aap: "healthy",
				debridement: "1",
				gi: "0",
				pi: "0",
				referrals: "none",
			},
			radiographic: "none needed",
			diagnostic: "none needed",
		},
		needs: [
			{
				type: "maintenance",
				isMet: true,
			},
			{
				type: "integrity",
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
