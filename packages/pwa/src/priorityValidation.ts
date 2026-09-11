import type { Need } from "@dh-care-plan/core";

/**
 * Maps each need whose priority is a duplicate or breaks the 1..N sequence
 * to a message explaining why. Needs without a priority, or with a
 * non-numeric one, are ignored rather than flagged - this is a visual nudge,
 * not a hard validation rule.
 */
export function computePriorityErrors(needs: Need[]): Map<Need["type"], string> {
	const prioritized = needs
		.filter((need) => need.exists === true && need.priority?.trim())
		.map((need) => ({ type: need.type, value: Number(need.priority) }))
		.filter(({ value }) => Number.isInteger(value) && value > 0);

	const counts = new Map<number, number>();
	for (const { value } of prioritized) {
		counts.set(value, (counts.get(value) ?? 0) + 1);
	}

	const distinctValues = [...new Set(prioritized.map(({ value }) => value))].sort((a, b) => a - b);
	const hasGap = distinctValues.some((value, i) => value !== i + 1);

	const errors = new Map<Need["type"], string>();
	for (const { type, value } of prioritized) {
		if ((counts.get(value) ?? 0) > 1) {
			errors.set(type, `Priority ${value} is used more than once`);
		} else if (hasGap) {
			errors.set(type, `Priorities should run 1..${distinctValues.length} without gaps`);
		}
	}
	return errors;
}
