import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { downloadFile, pickSaveDestination } from "../src/files";

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

test("a picked handle's own name is used, not the suggested one", async () => {
	vi.stubGlobal(
		"showSaveFilePicker",
		vi.fn().mockResolvedValue({
			name: "renamed-by-user.docx",
			createWritable: () => Promise.resolve({ write: vi.fn(), close: vi.fn() }),
		}),
	);

	const destination = await pickSaveDestination("suggested.docx", "text/plain");

	expect(destination?.name).toBe("renamed-by-user.docx");
});

test("cancelling the picker resolves to null", async () => {
	const abort = new Error("cancelled");
	abort.name = "AbortError";
	vi.stubGlobal("showSaveFilePicker", vi.fn().mockRejectedValue(abort));

	expect(await pickSaveDestination("suggested.docx", "text/plain")).toBeNull();
});

test("a genuine picker failure throws by default rather than faking a destination", async () => {
	vi.stubGlobal("showSaveFilePicker", vi.fn().mockRejectedValue(new Error("permission denied")));

	await expect(pickSaveDestination("suggested.docx", "text/plain")).rejects.toThrow(
		"permission denied",
	);
});

test("lenientFallback treats a genuine picker failure like an unsupported browser", async () => {
	vi.stubGlobal("showSaveFilePicker", vi.fn().mockRejectedValue(new Error("permission denied")));
	const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

	const destination = await pickSaveDestination("suggested.docx", "text/plain", undefined, {
		lenientFallback: true,
	});

	expect(destination?.name).toBe("suggested.docx");
	await destination?.write("data");
	expect(click).toHaveBeenCalled();
});

test("browsers without a picker fall back to a download under the suggested name", async () => {
	const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

	const destination = await pickSaveDestination("suggested.docx", "text/plain");

	expect(destination?.name).toBe("suggested.docx");
	await destination?.write("data");
	expect(click).toHaveBeenCalled();
});

test("downloadFile triggers a download link under the given name", () => {
	const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

	downloadFile("data", "plan.docx", "application/octet-stream");

	expect(click).toHaveBeenCalled();
});
