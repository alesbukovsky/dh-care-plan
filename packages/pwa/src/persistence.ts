import { Config, Plan } from "@dh-care-plan/core";

const DRAFT_STORAGE_KEY = "dh-care-plan:draft";
const DRAFT_VERSION = 1;
const PROBE_KEY = "dh-care-plan:storage-probe";

export interface Draft {
	plan: Plan;
	config: Config;
}

interface StoredDraft {
	version: number;
	plan: unknown;
	config: unknown;
}

/** Persists the current draft. Returns whether the write succeeded. */
export function saveDraft(plan: Plan, config: Config): boolean {
	const payload: StoredDraft = { version: DRAFT_VERSION, plan, config };
	try {
		localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(payload));
		return true;
	} catch {
		return false;
	}
}

/**
 * Restores the last saved draft, or `null` if there isn't one, it's
 * unreadable, or it no longer matches the current schema. A draft that
 * fails to restore is cleared so it doesn't keep failing on every load.
 */
export function loadDraft(): Draft | null {
	let raw: string | null;
	try {
		raw = localStorage.getItem(DRAFT_STORAGE_KEY);
	} catch {
		return null;
	}
	if (!raw) return null;

	let stored: StoredDraft;
	try {
		stored = JSON.parse(raw);
	} catch {
		clearDraft();
		return null;
	}

	if (stored.version !== DRAFT_VERSION) {
		clearDraft();
		return null;
	}

	const plan = Plan.safeParse(stored.plan);
	const config = Config.safeParse(stored.config);
	if (!plan.success || !config.success) {
		clearDraft();
		return null;
	}

	return { plan: plan.data, config: config.data };
}

export function clearDraft(): void {
	try {
		localStorage.removeItem(DRAFT_STORAGE_KEY);
	} catch {
		// Storage unavailable — nothing to clear.
	}
}

/** Feature-detects whether `localStorage` is actually usable right now. */
export function isStorageAvailable(): boolean {
	try {
		localStorage.setItem(PROBE_KEY, "1");
		localStorage.removeItem(PROBE_KEY);
		return true;
	} catch {
		return false;
	}
}
