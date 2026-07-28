import type { Plan } from "dh-care-plan/schema";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { exportPlan, planFileName } from "../src/export";

const TODAY = new Date("2026-07-28T10:00:00Z");

function makePlan(patient: Partial<Plan["patient"]> = {}): Plan {
	return {
		patient: { initials: "", dob: "", chartId: "", ...patient },
		appointments: [],
		subjective: {},
		objective: {},
		needs: [],
	};
}

/** jsdom implements neither the object URL helpers nor the file picker. */
beforeEach(() => {
	vi.stubGlobal(
		"URL",
		Object.assign(URL, { createObjectURL: () => "blob:plan", revokeObjectURL() {} }),
	);
});

afterEach(() => {
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

function stubClick() {
	return vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
}

test("the filename lists the initials before the chart id, without dots", () => {
	expect(planFileName(makePlan({ initials: "J.D.", chartId: "A 1234" }), TODAY)).toBe(
		"plan-JD-A-1234-2026-07-28.json",
	);
	expect(planFileName(makePlan({ initials: "J.D." }), TODAY)).toBe("plan-JD-2026-07-28.json");
	expect(planFileName(makePlan({ chartId: "A1234" }), TODAY)).toBe("plan-A1234-2026-07-28.json");
	expect(planFileName(makePlan(), TODAY)).toBe("plan-2026-07-28.json");
});

test("the plan is written to the file the user picks", async () => {
	const write = vi.fn();
	const close = vi.fn();
	const showSaveFilePicker = vi.fn().mockResolvedValue({
		createWritable: () => Promise.resolve({ write, close }),
	});
	vi.stubGlobal("showSaveFilePicker", showSaveFilePicker);

	const plan = makePlan({ initials: "J.D.", chartId: "A1234" });
	await exportPlan(plan, TODAY);

	expect(showSaveFilePicker).toHaveBeenCalledWith(
		expect.objectContaining({ suggestedName: "plan-JD-A1234-2026-07-28.json" }),
	);
	expect(write).toHaveBeenCalledWith(`${JSON.stringify(plan, null, 2)}\n`);
	expect(close).toHaveBeenCalled();
});

test("cancelling the picker writes nothing", async () => {
	const abort = new Error("cancelled");
	abort.name = "AbortError";
	vi.stubGlobal("showSaveFilePicker", vi.fn().mockRejectedValue(abort));
	const click = stubClick();

	await exportPlan(makePlan(), TODAY);

	expect(click).not.toHaveBeenCalled();
});

test("a failing picker falls back to a download", async () => {
	vi.stubGlobal("showSaveFilePicker", vi.fn().mockRejectedValue(new Error("not allowed")));
	const click = stubClick();

	await exportPlan(makePlan(), TODAY);

	expect(click).toHaveBeenCalled();
});

test("browsers without a picker download the file directly", async () => {
	const click = stubClick();

	await exportPlan(makePlan({ initials: "JD" }), TODAY);

	expect(click).toHaveBeenCalled();
});
