import { DEFAULT_CONFIG } from "@dh-care-plan/core";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { exportConfig, readConfigFile } from "../src/configFile";

function makeFile(contents: string, name = "config.json"): File {
	return new File([contents], name, { type: "application/json" });
}

function configFile(config: unknown, name?: string): File {
	return makeFile(JSON.stringify(config, null, 2), name);
}

test("a valid config file is accepted and returned", async () => {
	const result = await readConfigFile(configFile(DEFAULT_CONFIG));

	expect(result).toEqual({ ok: true, config: DEFAULT_CONFIG });
});

test("an empty file is reported by name", async () => {
	const result = await readConfigFile(makeFile("   \n", "blank.json"));

	expect(result).toMatchObject({ ok: false, issues: [] });
	expect(result.ok ? "" : result.summary).toBe("“blank.json” is empty.");
});

test("a file that is not JSON explains what import expects", async () => {
	const result = await readConfigFile(makeFile("Not a config, just prose.", "notes.txt"));

	if (result.ok) throw new Error("expected the import to fail");
	expect(result.summary).toContain("“notes.txt” is not a JSON file");
	expect(result.issues[0]?.field).toBe("The file");
	expect(result.issues[0]?.message).toBeTruthy();
});

test("an unreadable file is reported instead of thrown", async () => {
	const file = {
		name: "locked.json",
		text: () => Promise.reject(new Error("NotReadableError")),
	} as unknown as File;

	const result = await readConfigFile(file);

	expect(result.ok ? "" : result.summary).toBe(
		"“locked.json” could not be read. Check the file and try again.",
	);
});

test("a missing field is reported with its plain-language label", async () => {
	const { format, ...rest } = DEFAULT_CONFIG;
	const { visits, ...formatRest } = format;
	const result = await readConfigFile(configFile({ ...rest, format: formatRest }));

	if (result.ok) throw new Error("expected the import to fail");
	expect(result.issues).toEqual([
		{
			field: "Format → Visits",
			message: "This field is required, but the file does not have it.",
		},
	]);
});

test("a wrong type names both what was expected and what the file has", async () => {
	const result = await readConfigFile(
		configFile({
			...DEFAULT_CONFIG,
			mapping: {
				...DEFAULT_CONFIG.mapping,
				outcome: { ...DEFAULT_CONFIG.mapping.outcome, met: 1 },
			},
		}),
	);

	if (result.ok) throw new Error("expected the import to fail");
	expect(result.issues).toEqual([
		{
			field: "Mapping → Outcome labels → Met",
			message: "Expected text, but the file has a number (1).",
		},
	]);
});

/** jsdom implements neither the object URL helpers nor the file picker. */
beforeEach(() => {
	vi.stubGlobal(
		"URL",
		Object.assign(URL, { createObjectURL: () => "blob:config", revokeObjectURL() {} }),
	);
});

afterEach(() => {
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

test("the config is written to the file the user picks", async () => {
	const write = vi.fn();
	const close = vi.fn();
	const showSaveFilePicker = vi.fn().mockResolvedValue({
		createWritable: () => Promise.resolve({ write, close }),
	});
	vi.stubGlobal("showSaveFilePicker", showSaveFilePicker);

	await exportConfig(DEFAULT_CONFIG);

	expect(showSaveFilePicker).toHaveBeenCalledWith(
		expect.objectContaining({ suggestedName: "config.json" }),
	);
	expect(write).toHaveBeenCalledWith(`${JSON.stringify(DEFAULT_CONFIG, null, 2)}\n`);
	expect(close).toHaveBeenCalled();
});

test("browsers without a picker download the file directly", async () => {
	const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

	await exportConfig(DEFAULT_CONFIG);

	expect(click).toHaveBeenCalled();
});
