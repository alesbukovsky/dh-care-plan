import { type Config, DEFAULT_CONFIG, DEFAULT_PLAN, type Plan } from "@dh-care-plan/core";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { clearDraft, isStorageAvailable, loadDraft, saveDraft } from "../src/persistence";

const DRAFT_STORAGE_KEY = "dh-care-plan:draft";

function makePlan(patient: Partial<Plan["patient"]> = {}): Plan {
	return { ...DEFAULT_PLAN, patient };
}

beforeEach(() => {
	localStorage.clear();
});

afterEach(() => {
	vi.restoreAllMocks();
});

test("a saved draft round-trips through load", () => {
	const plan = makePlan({ initials: "J.D." });
	const config: Config = DEFAULT_CONFIG;

	expect(saveDraft(plan, config)).toBe(true);
	expect(loadDraft()).toEqual({ plan, config });
});

test("no draft yet reports no draft", () => {
	expect(loadDraft()).toBeNull();
});

test("corrupt JSON is treated as no draft, and the bad entry is cleared", () => {
	localStorage.setItem(DRAFT_STORAGE_KEY, "{not json");

	expect(loadDraft()).toBeNull();
	expect(localStorage.getItem(DRAFT_STORAGE_KEY)).toBeNull();
});

test("a draft that no longer matches the schema, even after migrating, is treated as no draft, and cleared", () => {
	localStorage.setItem(
		DRAFT_STORAGE_KEY,
		JSON.stringify({ plan: { needs: "not an array" }, config: DEFAULT_CONFIG }),
	);

	expect(loadDraft()).toBeNull();
	expect(localStorage.getItem(DRAFT_STORAGE_KEY)).toBeNull();
});

test("a plan saved under a version with no migration path is treated as no draft, and cleared", () => {
	localStorage.setItem(
		DRAFT_STORAGE_KEY,
		JSON.stringify({
			plan: { ...DEFAULT_PLAN, version: -1 },
			config: DEFAULT_CONFIG,
		}),
	);

	expect(loadDraft()).toBeNull();
	expect(localStorage.getItem(DRAFT_STORAGE_KEY)).toBeNull();
});

test("a plan saved under a version newer than this build understands is treated as no draft, and cleared", () => {
	localStorage.setItem(
		DRAFT_STORAGE_KEY,
		JSON.stringify({
			plan: { ...DEFAULT_PLAN, version: 99 },
			config: DEFAULT_CONFIG,
		}),
	);

	expect(loadDraft()).toBeNull();
	expect(localStorage.getItem(DRAFT_STORAGE_KEY)).toBeNull();
});

test("a plan with no version field at all is assumed to predate that field, and stamped with the current one", () => {
	const { version, ...v1Plan } = {
		...DEFAULT_PLAN,
		objective: { exams: { findings: "no visible lesions" } },
	};
	localStorage.setItem(
		DRAFT_STORAGE_KEY,
		JSON.stringify({ plan: v1Plan, config: DEFAULT_CONFIG }),
	);

	expect(loadDraft()).toEqual({
		plan: { ...DEFAULT_PLAN, objective: { exams: { findings: "no visible lesions" } } },
		config: DEFAULT_CONFIG,
	});
});

test("clearDraft removes any saved draft", () => {
	saveDraft(makePlan(), DEFAULT_CONFIG);

	clearDraft();

	expect(loadDraft()).toBeNull();
});

test("a saveDraft that throws is reported as failed, not thrown", () => {
	vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
		throw new Error("QuotaExceededError");
	});

	expect(saveDraft(makePlan(), DEFAULT_CONFIG)).toBe(false);
});

test("a loadDraft that can't read storage returns no draft instead of throwing", () => {
	vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
		throw new Error("SecurityError");
	});

	expect(loadDraft()).toBeNull();
});

test("storage availability reflects whether localStorage actually works", () => {
	expect(isStorageAvailable()).toBe(true);

	vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
		throw new Error("SecurityError");
	});

	expect(isStorageAvailable()).toBe(false);
});
