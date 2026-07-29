import type { z } from "zod";
import { Config } from "./schema/config";
import { Plan } from "./schema/plan";

export type SchemaIssue = z.core.$ZodIssue;

export type JsonResult = { ok: true; data: unknown } | { ok: false; message: string };

export type ParseResult<T> =
	| { ok: true; data: T }
	| { ok: false; reason: "json"; message: string }
	| { ok: false; reason: "schema"; issues: SchemaIssue[]; raw: unknown };

export function parseJson(input: ArrayBuffer | string): JsonResult {
	const text = typeof input === "string" ? input : new TextDecoder().decode(input);
	try {
		return { ok: true, data: JSON.parse(text) };
	} catch (err) {
		return { ok: false, message: err instanceof Error ? err.message : String(err) };
	}
}

export function parseWith<S extends z.ZodType>(
	schema: S,
	input: ArrayBuffer | string,
): ParseResult<z.output<S>> {
	const json = parseJson(input);
	if (!json.ok) return { ok: false, reason: "json", message: json.message };

	const res = schema.safeParse(json.data);
	if (res.success) return { ok: true, data: res.data };

	return { ok: false, reason: "schema", issues: res.error.issues, raw: json.data };
}

export function parsePlan(input: ArrayBuffer | string): ParseResult<Plan> {
	return parseWith(Plan, input);
}

export function parseConfig(input: ArrayBuffer | string): ParseResult<Config> {
	return parseWith(Config, input);
}
