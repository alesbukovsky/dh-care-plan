import Docxtemplater from "docxtemplater";
import expressionParser from "docxtemplater/expressions.js";
import PizZip from "pizzip";

export type TemplaterOptions = Omit<
	Docxtemplater.DXT.ConstructorOptions,
	"parser" | "paragraphLoop" | "linebreaks"
>;

export function createTemplater(
	input: ArrayBuffer,
	options?: TemplaterOptions,
): Docxtemplater {
	const zip = new PizZip(input);
	return new Docxtemplater(zip, {
		errorLogging: false,
		...options,
		parser: expressionParser,
		paragraphLoop: true,
		linebreaks: true,
	});
}

interface DocxtemplaterError {
	message: string;
	properties?: {
		errors?: Array<{
			message: string;
			properties?: { explanation?: string };
		}>;
	};
}

export function describeTemplaterError(error: unknown): string {
	const docxError = error as DocxtemplaterError;
	const explanations = docxError.properties?.errors?.map(
		(e) => e.properties?.explanation ?? e.message,
	);
	return explanations?.join("\n") ?? docxError.message;
}
