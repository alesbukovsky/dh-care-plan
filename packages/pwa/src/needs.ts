import { DEFAULT_CONFIG, type Need } from "dh-care-plan";

export type NeedType = Need["type"];

export interface NeedDefinition {
	type: NeedType;
	name: string;
	def: string;
}

const NEED_DEFS: Record<NeedType, string> = {
	health:
		"Freedom from symptoms associated with abnormal or pathological conditions of the oral and craniofacial complex.",
	peace:
		"Feeling safe, in control, and free of excessive anxiety while receiving dental hygiene care.",
	comfort: "Freedom from physical discomfort in the head, neck, and oral cavity.",
	image: "Satisfaction with one's own oral-facial features, appearance, and breath.",
	integrity:
		"Skin and mucosa of the head and neck free of abnormal intraoral or extraoral lesions.",
	dentition:
		"Ability to bite, chew, taste, and esthetically maintain natural or restored teeth sufficient to eat and speak.",
	understanding:
		"Ability to understand, reason about, and make informed decisions regarding one's own oral health.",
	responsibility:
		"Accountability for one's own oral health outcomes and active participation in a plan of care.",
	maintenance: "Sustaining oral health gains and follow-up care between appointments.",
};

const NEED_ORDER = Object.keys(DEFAULT_CONFIG.mapping.need) as NeedType[];

export const NEEDS: NeedDefinition[] = NEED_ORDER.map((type) => ({
	type,
	name: DEFAULT_CONFIG.mapping.need[type],
	def: NEED_DEFS[type],
}));
