import InspectModule from "docxtemplater/js/inspect-module.js";
import { z } from "zod";
import { DataSchema } from "./schema/data";
import { TemplateSchema } from "./schema/template";
import { createTemplater, describeTemplaterError } from "./templater";

export interface ValidationIssue {
	path: string;
	message: string;
}

export type ValidationResult =
	| { valid: true }
	| { valid: false; issues: ValidationIssue[] };

export type Validator = (input: ArrayBuffer) => ValidationResult;

export function validateData(input: ArrayBuffer): ValidationResult {
	let parsed: unknown;
	try {
		parsed = JSON.parse(new TextDecoder().decode(input));
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		return {
			valid: false,
			issues: [{ path: "", message: `Invalid JSON: ${message}` }],
		};
	}

	const result = DataSchema.safeParse(parsed);
	if (result.success) return { valid: true };

	return {
		valid: false,
		issues: result.error.issues.map((issue) => ({
			path: issue.path.join("."),
			message: issue.message,
		})),
	};
}

function collectUndefinedTags(
	tagTree: Record<string, unknown>,
	shape: Record<string, z.ZodType>,
	path: string[],
	issues: ValidationIssue[],
): void {
	for (const [tag, children] of Object.entries(tagTree)) {
		const field = shape[tag];
		if (!field) {
			issues.push({
				path: [...path, tag].join("."),
				message: "not defined in TemplateSchema",
			});
		}

		const hasNestedTags =
			children !== null &&
			typeof children === "object" &&
			Object.keys(children).length > 0;
		if (hasNestedTags) {
			const nestedShape =
				field instanceof z.ZodArray && field.element instanceof z.ZodObject
					? field.element.shape
					: {};
			collectUndefinedTags(
				children as Record<string, unknown>,
				nestedShape,
				[...path, tag],
				issues,
			);
		}
	}
}

export function validateTemplate(input: ArrayBuffer): ValidationResult {
	const inspector = new InspectModule();

	try {
		const doc = createTemplater(input, {
			modules: [inspector],
			nullGetter: () => "",
		});
		doc.render({});
	} catch (error) {
		return {
			valid: false,
			issues: [{ path: "", message: describeTemplaterError(error) }],
		};
	}

	const issues: ValidationIssue[] = [];
	collectUndefinedTags(
		inspector.getAllTags(),
		TemplateSchema.shape,
		[],
		issues,
	);

	if (issues.length === 0) return { valid: true };
	return { valid: false, issues };
}
