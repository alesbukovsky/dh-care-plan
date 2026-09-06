import { DEFAULT_CONFIG, DEFAULT_PLAN, type Config, type Plan } from "@dh-care-plan/core";
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

test("a draft that no longer matches the schema is treated as no draft, and cleared", () => {
	localStorage.setItem(
		DRAFT_STORAGE_KEY,
		JSON.stringify({ version: 1, plan: { needs: "not an array" }, config: DEFAULT_CONFIG }),
	);

	expect(loadDraft()).toBeNull();
	expect(localStorage.getItem(DRAFT_STORAGE_KEY)).toBeNull();
});

test("a draft saved under an old version is treated as no draft, and cleared", () => {
	localStorage.setItem(
		DRAFT_STORAGE_KEY,
		JSON.stringify({ version: 0, plan: DEFAULT_PLAN, config: DEFAULT_CONFIG }),
	);

	expect(loadDraft()).toBeNull();
	expect(localStorage.getItem(DRAFT_STORAGE_KEY)).toBeNull();
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
