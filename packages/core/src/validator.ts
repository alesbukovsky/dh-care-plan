import InspectModule from "docxtemplater/js/inspect-module.js";
import { z } from "zod";
import { Config } from "./schema/config";
import { Plan } from "./schema/plan";
import { Template } from "./schema/template";
import { createTemplater, describeTemplaterError } from "./templater";

export interface ValidationIssue {
	path: string;
	message: string;
}

export type ValidationResult = { valid: true } | { valid: false; issues: ValidationIssue[] };

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

	const result = Plan.safeParse(parsed);
	if (result.success) return { valid: true };

	return {
		valid: false,
		issues: result.error.issues.map((issue) => ({
			path: issue.path.join("."),
			message: issue.message,
		})),
	};
}

export function validateConfig(input: ArrayBuffer): ValidationResult {
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

	const result = Config.safeParse(parsed);
	if (result.success) return { valid: true };

	return {
		valid: false,
		issues: result.error.issues.map((issue) => ({
			path: issue.path.join("."),
			message: issue.message,
		})),
	};
}

function resolveTagShape(
	shape: Record<string, z.ZodType>,
	tag: string,
): { field: z.ZodType | undefined; nestedShape: Record<string, z.ZodType> } {
	let currentShape = shape;
	let field: z.ZodType | undefined;

	for (const segment of tag.split(".")) {
		field = currentShape[segment];
		let unwrapped: z.ZodType | undefined = field;
		while (unwrapped instanceof z.ZodOptional || unwrapped instanceof z.ZodNullable) {
			unwrapped = unwrapped.unwrap() as z.ZodType;
		}
		if (unwrapped instanceof z.ZodObject) {
			currentShape = unwrapped.shape;
		} else if (unwrapped instanceof z.ZodArray && unwrapped.element instanceof z.ZodObject) {
			currentShape = unwrapped.element.shape;
		} else if (unwrapped instanceof z.ZodArray) {
			// Loop over an array of primitives: each item becomes the scope,
			// only self-reference (".") is valid inside.
			currentShape = {};
		}
		// Otherwise the field is a scalar used as an if-section ({#field}...{/field}):
		// docxtemplater doesn't rescope, so leave currentShape as the enclosing shape.
	}

	return { field, nestedShape: currentShape };
}

function stripFilters(tag: string): string {
	return (tag.split("|")[0] ?? tag).trim();
}

function collectUndefinedTags(
	tagTree: Record<string, unknown>,
	shape: Record<string, z.ZodType>,
	path: string[],
	issues: ValidationIssue[],
): void {
	for (const [tag, children] of Object.entries(tagTree)) {
		const baseTag = stripFilters(tag);
		if (baseTag === ".") continue;

		const { field, nestedShape } = resolveTagShape(shape, baseTag);
		if (!field) {
			issues.push({
				path: [...path, baseTag].join("."),
				message: "not defined in Template",
			});
		}

		const hasNestedTags =
			children !== null && typeof children === "object" && Object.keys(children).length > 0;
		if (hasNestedTags) {
			collectUndefinedTags(
				children as Record<string, unknown>,
				nestedShape,
				[...path, baseTag],
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
		});
		doc.render({});
	} catch (error) {
		return {
			valid: false,
			issues: [{ path: "", message: describeTemplaterError(error) }],
		};
	}

	const issues: ValidationIssue[] = [];
	collectUndefinedTags(inspector.getAllTags(), Template.shape, [], issues);

	if (issues.length === 0) return { valid: true };
	return { valid: false, issues };
}
