import { type Config, parseConfig } from "@dh-care-plan/core";
import { saveFile } from "./files";
import { describeSchemaIssues, type ImportIssue } from "./schemaIssues";

export interface ConfigImportFailure {
	ok: false;
	summary: string;
	issues: ImportIssue[];
}

export type ConfigImportResult = { ok: true; config: Config } | ConfigImportFailure;

const CONFIG_FILE_NAME = "config.json";

const FIELD_LABELS: Record<string, string> = {
	date: "Date",
	doneBy: "Target date",
	format: "Format",
	goal: "Goal",
	mapping: "Mapping",
	need: "Need labels",
	outcome: "Outcome labels",
	visits: "Visits",
	vitals: "Vitals",
	image: "Wholesome facial image",
	peace: "Freedom from anxiety / stress",
	integrity: "Skin and mucous membrane integrity",
	health: "Protection from health risks",
	comfort: "Freedom from head and neck pain",
	dentition: "Biologically sound and functional dentition",
	understanding: "Conceptualization and understanding",
	responsibility: "Responsibility for oral health",
	maintenance: "Health maintenance",
	met: "Met",
	partial: "Partially met",
	unmet: "Not met",
	undefined: "TBD",
};

function fail(summary: string, issues: ImportIssue[] = []): ConfigImportFailure {
	return { ok: false, summary, issues };
}

export async function exportConfig(config: Config): Promise<void> {
	const json = `${JSON.stringify(config, null, 2)}\n`;
	await saveFile(json, CONFIG_FILE_NAME, "application/json", [
		{ description: "Care plan config JSON", accept: { "application/json": [".json"] } },
	]);
}

export async function readConfigFile(file: File): Promise<ConfigImportResult> {
	let text: string;
	try {
		text = await file.text();
	} catch {
		return fail(`“${file.name}” could not be read. Check the file and try again.`);
	}

	if (text.trim() === "") return fail(`“${file.name}” is empty.`);

	const result = parseConfig(text);
	if (result.ok) return { ok: true, config: result.data };

	if (result.reason === "json") {
		return fail(
			`“${file.name}” is not a JSON file. Import expects a config exported from this app.`,
			[{ field: "The file", message: result.message }],
		);
	}

	const issues = describeSchemaIssues(result.issues, result.raw, FIELD_LABELS);

	return fail(
		`“${file.name}” is not a valid config. ${issues.length === 1 ? "One field needs" : `${issues.length} fields need`} attention:`,
		issues,
	);
}
