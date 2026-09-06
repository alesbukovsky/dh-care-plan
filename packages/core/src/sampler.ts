import { convertData } from "./converter";
import type { Config } from "./schema/config";
import { DEFAULT_CONFIG } from "./schema/config";
import type { Plan } from "./schema/plan";
import type { Template } from "./schema/template";

export function getPlanSample(): Plan {
	return {
		study: "case study text",
		patient: { initials: "J.D.", dob: "1990-01-01", chartId: "12345" },
		subjective: {
			complaint: "sensitive teeth",
			personal: "no relevant personal history",
			medical: "no relevant medical history",
			dental: "brushes twice daily, does not floss",
			social: "no relevant social history",
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
			vitals: {
				visits: [
					{ date: "2026-08-01", vitals: "BP 120/80, pulse 72" },
					{ date: "2026-07-01", vitals: "BP 118/76, pulse 70" },
				],
			},
		},
		conditions: [
			{
				description: "Type 2 diabetes",
				medications: "Metformin 500mg BID",
				adverse: "none reported",
				interactions: "none noted",
				modifications: "morning appointments preferred",
				recommendations: "monitor for delayed healing",
			},
		],
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
		appointments: {
			interval: "3 months",
			planned: [
				{
					length: "60 minutes",
					prophylaxis: "full mouth debridement",
					instruction: "flossing technique",
					recommendation: "return in 3 months",
					referral: "none",
				},
			],
		},
	};
}

export function getTemplateSample(): Template {
	return convertData(getPlanSample());
}

export function getConfigSample(): Config {
	return DEFAULT_CONFIG;
}
