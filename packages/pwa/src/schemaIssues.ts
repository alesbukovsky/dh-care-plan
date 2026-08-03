import type { SchemaIssue } from "@dh-care-plan/core";

export interface ImportIssue {
	field: string;
	message: string;
}

function humanize(segment: string): string {
	const words = segment.replace(/([a-z0-9])([A-Z])/g, "$1 $2").toLowerCase();
	return words.charAt(0).toUpperCase() + words.slice(1);
}

type Path = readonly PropertyKey[];

function describePath(path: Path, fieldLabels: Record<string, string>): string {
	if (path.length === 0) return "The file";

	let trail = "";
	for (const segment of path) {
		if (typeof segment === "number") {
			trail += ` #${segment + 1}`;
			continue;
		}
		const key = String(segment);
		trail += `${trail === "" ? "" : " → "}${fieldLabels[key] ?? humanize(key)}`;
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
		// Every formatted field in a plan or config is an ISO date.
		case "invalid_format":
			return `Must be a date written as YYYY-MM-DD, but the file has ${describeValue(
				valueAt(data, issue.path),
			)}.`;
		default:
			return issue.message;
	}
}

/** Turns raw schema issues into field/message pairs phrased in plain language. */
export function describeSchemaIssues(
	issues: readonly SchemaIssue[],
	raw: unknown,
	fieldLabels: Record<string, string>,
): ImportIssue[] {
	return issues.map((issue) => ({
		field: describePath(issue.path, fieldLabels),
		message: describeIssue(issue, raw),
	}));
}
