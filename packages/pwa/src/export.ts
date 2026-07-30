import type { Plan } from "@dh-care-plan/core";

interface SaveFilePickerOptions {
	suggestedName?: string;
	types?: { description?: string; accept: Record<string, string[]> }[];
}

interface WritableFile {
	write: (data: string) => Promise<void>;
	close: () => Promise<void>;
}

interface SaveFileHandle {
	createWritable: () => Promise<WritableFile>;
}

/**
 * The File System Access API is not in the DOM typings yet, and is unavailable in
 * Firefox and Safari, where we fall back to a plain download.
 */
type FilePickerWindow = Window & {
	showSaveFilePicker?: (options: SaveFilePickerOptions) => Promise<SaveFileHandle>;
};

/** Builds a filename such as `plan-JD-A1234-2026-07-28.json`. */
export function planFileName(plan: Plan, today: Date): string {
	const slug = (value: string) =>
		value
			.replace(/\./g, "")
			.replace(/[^A-Za-z0-9]+/g, "-")
			.replace(/^-|-$/g, "");
	const date = today.toISOString().slice(0, 10);
	const parts = ["plan", slug(plan.patient.initials), slug(plan.patient.chartId), date];
	return `${parts.filter(Boolean).join("-")}.json`;
}

function download(json: string, fileName: string): void {
	const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
	const link = document.createElement("a");
	link.href = url;
	link.download = fileName;
	link.click();
	URL.revokeObjectURL(url);
}

/**
 * Asks the user where to save the plan and writes it there as JSON. Resolves
 * without writing anything when the user cancels the picker.
 */
export async function exportPlan(plan: Plan, today = new Date()): Promise<void> {
	const json = `${JSON.stringify(plan, null, 2)}\n`;
	const fileName = planFileName(plan, today);
	const picker = (window as FilePickerWindow).showSaveFilePicker;

	if (picker) {
		let handle: SaveFileHandle;
		try {
			handle = await picker.call(window, {
				suggestedName: fileName,
				types: [{ description: "Care plan JSON", accept: { "application/json": [".json"] } }],
			});
		} catch (error) {
			if (error instanceof Error && error.name === "AbortError") return;
			download(json, fileName);
			return;
		}
		const writable = await handle.createWritable();
		await writable.write(json);
		await writable.close();
		return;
	}

	download(json, fileName);
}
