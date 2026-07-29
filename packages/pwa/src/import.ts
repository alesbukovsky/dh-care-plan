import { parsePlan, type SchemaIssue } from "dh-care-plan";
import type { Plan } from "dh-care-plan/schema";

export interface ImportIssue {
	/** Where the problem is, in the words the UI uses, e.g. `Patient → Date of birth`. */
	field: string;
	message: string;
}

export interface ImportFailure {
	ok: false;
	summary: string;
	issues: ImportIssue[];
}

export type ImportResult = { ok: true; plan: Plan } | ImportFailure;

/** Plan field names as they are labelled in the editor. */
const FIELD_LABELS: Record<string, string> = {
	aap: "AAP classification",
	allergies: "Allergies",
	appointments: "Appointments",
	asa: "ASA classification",
	bmi: "BMI",
	caries: "Caries",
	chartId: "Chart ID",
	complaint: "Chief complaint",
	debridement: "Debridement",
	dental: "Dental history",
	diagnostic: "Diagnostic tests",
	diseases: "Diseases",
	dob: "Date of birth",
	doneBy: "Target date",
	evidencedBy: "Evidenced by",
	exams: "Exams",
	findings: "Findings",
	gi: "Gingival index",
	gingiva: "Gingiva",
	goals: "Goals",
	initials: "Initials",
	interventions: "Interventions",
	isMet: "Need met",
	medical: "Medical history",
	medications: "Medications",
	needs: "Human needs",
	objective: "Objective data",
	occlusion: "Occlusion",
	outcome: "Outcome",
	patient: "Patient",
	periodontal: "Periodontal",
	personal: "Personal history",
	pi: "Plaque index",
	radiographic: "Radiographic findings",
	referrals: "Referrals",
	relatedTo: "Related to",
	relative: "Relative date",
	restorations: "Restorations",
	restorative: "Restorative",
	risk: "Caries risk",
	significance: "Significance",
	social: "Social history",
	status: "Status",
	subjective: "Subjective data",
	task: "Task",
	type: "Need type",
};

/** `chiefComplaint` becomes `Chief complaint`. */
function humanize(segment: string): string {
	const words = segment.replace(/([a-z0-9])([A-Z])/g, "$1 $2").toLowerCase();
	return words.charAt(0).toUpperCase() + words.slice(1);
}

type Path = readonly PropertyKey[];

/** Renders a schema path as a trail of labels, e.g. `Human needs #1 → Goals #2 → Task`. */
function describePath(path: Path): string {
	if (path.length === 0) return "The file";

	let trail = "";
	for (const segment of path) {
		if (typeof segment === "number") {
			// Array indices belong to the field just named, not to a step of their own.
			trail += ` #${segment + 1}`;
			continue;
		}
		const key = String(segment);
		trail += `${trail === "" ? "" : " → "}${FIELD_LABELS[key] ?? humanize(key)}`;
	}
	return trail;
}

function valueAt(root: unknown, path: Path): unknown {
	let current: unknown = root;
	for (const segment of path) {
		current = (current as Record<PropertyKey, unknown> | null | undefined)?.[segment];
	}
	return current;
}

const EXPECTED_LABELS: Record<string, string> = {
	array: "a list",
	boolean: "a true/false value",
	number: "a number",
	object: "a group of fields",
	string: "text",
};

function describeValue(value: unknown): string {
	if (value === null) return "an empty value";
	if (Array.isArray(value)) return "a list";
	if (typeof value === "string") {
		if (value === "") return "empty text";
		return `text ("${value.length > 30 ? `${value.slice(0, 30)}…` : value}")`;
	}
	if (typeof value === "object") return "a group of fields";
	if (typeof value === "boolean") return `a true/false value (${value})`;
	// JSON has nothing else left.
	return `a number (${String(value)})`;
}

function describeIssue(issue: SchemaIssue, data: unknown): string {
	switch (issue.code) {
		case "invalid_type": {
			const value = valueAt(data, issue.path);
			const expected = EXPECTED_LABELS[issue.expected] ?? issue.expected;
			return value === undefined
				? "This field is required, but the file does not have it."
				: `Expected ${expected}, but the file has ${describeValue(value)}.`;
		}
		case "invalid_value":
			return `Must be one of: ${issue.values.map(String).join(", ")}.`;
		// Every formatted field in a plan is an ISO date.
		case "invalid_format":
			return `Must be a date written as YYYY-MM-DD, but the file has ${describeValue(
				valueAt(data, issue.path),
			)}.`;
		default:
			return issue.message;
	}
}

function fail(summary: string, issues: ImportIssue[] = []): ImportFailure {
	return { ok: false, summary, issues };
}

/**
 * Reads a care plan out of a file the user picked, describing every problem in
 * plain language when the file cannot be used.
 */
export async function readPlanFile(file: File): Promise<ImportResult> {
	let text: string;
	try {
		text = await file.text();
	} catch {
		return fail(`“${file.name}” could not be read. Check the file and try again.`);
	}

	if (text.trim() === "") return fail(`“${file.name}” is empty.`);

	const result = parsePlan(text);
	if (result.ok) return { ok: true, plan: result.data };

	if (result.reason === "json") {
		return fail(
			`“${file.name}” is not a JSON file. Import expects a care plan exported from this app.`,
			[{ field: "The file", message: result.message }],
		);
	}

	const issues = result.issues.map((issue) => ({
		field: describePath(issue.path),
		message: describeIssue(issue, result.raw),
	}));

	return fail(
		`“${file.name}” is not a valid care plan. ${issues.length === 1 ? "One field needs" : `${issues.length} fields need`} attention:`,
		issues,
	);
}
