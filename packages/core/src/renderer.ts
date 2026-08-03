import Docxtemplater from "docxtemplater";
import expressionParser from "docxtemplater/expressions.js";
import InspectModule from "docxtemplater/js/inspect-module.js";
import PizZip from "pizzip";
import { z } from "zod";
import { convertData } from "./converter";
import type { Config } from "./schema/config";
import type { Plan } from "./schema/plan";
import { Template } from "./schema/template";

export type TemplaterOptions = Omit<
	Docxtemplater.DXT.ConstructorOptions,
	"parser" | "paragraphLoop" | "linebreaks"
>;

expressionParser.filters.lower = (input: unknown) =>
	typeof input === "string" ? input.toLowerCase() : input;

export function createTemplater(input: Uint8Array, options?: TemplaterOptions): Docxtemplater {
	const zip = new PizZip(input);
	return new Docxtemplater(zip, {
		errorLogging: false,
		nullGetter: () => "",
		...options,
		parser: expressionParser,
		paragraphLoop: true,
		linebreaks: true,
	});
}

interface DocxTemplaterError {
	message: string;
	properties?: {
		errors?: Array<{
			message: string;
			properties?: { explanation?: string };
		}>;
	};
}

export function describeTemplaterError(error: unknown): string {
	const docxError = error as DocxTemplaterError;
	const out = docxError.properties?.errors?.map((e) => e.properties?.explanation ?? e.message);
	return out?.join("\n") ?? docxError.message;
}

export type RenderResult = { ok: true; output: Uint8Array } | { ok: false; message: string };

export function render(plan: Plan, template: Uint8Array, config?: Config): RenderResult {
	const data = convertData(plan, config);

	try {
		const doc = createTemplater(template);
		doc.render(data);
		return { ok: true, output: doc.getZip().generate({ type: "uint8array" }) };
	} catch (error) {
		return { ok: false, message: describeTemplaterError(error) };
	}
}

export interface TemplateIssue {
	path: string;
	message: string;
}

export type TemplateResult = { ok: true } | { ok: false; issues: TemplateIssue[] };

function resolveTagShape(
	shape: Record<string, z.ZodType>,
	tag: string,
): { field: z.ZodType | undefined; nestedShape: Record<string, z.ZodType> } {
	let currentShape = shape;
	let field: z.ZodType | undefined;

	for (const segment of tag.split(".")) {
		field = currentShape[segment];
		let unwrapped: z.ZodType | undefined = field;
		while (
			unwrapped instanceof z.ZodOptional ||
			unwrapped instanceof z.ZodNullable ||
			unwrapped instanceof z.ZodDefault
		) {
			unwrapped =
				unwrapped instanceof z.ZodDefault
					? (unwrapped.def.innerType as z.ZodType)
					: (unwrapped.unwrap() as z.ZodType);
		}
		if (unwrapped instanceof z.ZodObject) {
			currentShape = unwrapped.shape;
		} else if (unwrapped instanceof z.ZodArray && unwrapped.element instanceof z.ZodObject) {
			currentShape = unwrapped.element.shape;
		} else if (unwrapped instanceof z.ZodArray) {
			currentShape = {};
		}
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
	issues: TemplateIssue[],
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

export function checkTemplate(input: Uint8Array): TemplateResult {
	const inspector = new InspectModule();

	try {
		const doc = createTemplater(input, { modules: [inspector] });
		doc.render({});
	} catch (error) {
		return { ok: false, issues: [{ path: "", message: describeTemplaterError(error) }] };
	}

	const issues: TemplateIssue[] = [];
	collectUndefinedTags(inspector.getAllTags(), Template.shape, [], issues);

	if (issues.length === 0) return { ok: true };
	return { ok: false, issues };
}
