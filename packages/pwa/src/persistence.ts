import { Config, migrateConfig, migratePlan, Plan } from "@dh-care-plan/core";

const DRAFT_STORAGE_KEY = "dh-care-plan:draft";
const PROBE_KEY = "dh-care-plan:storage-probe";

export interface Draft {
	plan: Plan;
	config: Config;
}

interface StoredDraft {
	plan: unknown;
	config: unknown;
}

/**
 * Persists the current draft. `plan`/`config` already carry their own
 * `version` (defaulted in by `Plan.parse`/`Config.parse`), so the stored
 * payload is self-describing with no extra envelope. Returns whether the
 * write succeeded.
 */
export function saveDraft(plan: Plan, config: Config): boolean {
	const payload: StoredDraft = { plan, config };
	try {
		localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(payload));
		return true;
	} catch {
		return false;
	}
}

/**
 * Restores the last saved draft, or `null` if there isn't one, it's
 * unreadable, or it no longer matches the current schema (even after
 * migrating — see `migratePlan`/`migrateConfig` in `@dh-care-plan/core`). A
 * draft that fails to restore is cleared so it doesn't keep failing on
 * every load.
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

	let migratedPlan: ReturnType<typeof migratePlan>;
	let migratedConfig: ReturnType<typeof migrateConfig>;
	try {
		migratedPlan = migratePlan(stored.plan);
		migratedConfig = migrateConfig(stored.config);
	} catch {
		migratedPlan = null;
		migratedConfig = null;
	}
	if (!migratedPlan || !migratedConfig) {
		clearDraft();
		return null;
	}

	const plan = Plan.safeParse(migratedPlan.data);
	const config = Config.safeParse(migratedConfig.data);
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
