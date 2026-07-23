import Docxtemplater from "docxtemplater";
import expressionParser from "docxtemplater/expressions.js";
import PizZip from "pizzip";

// docxtemplater ships no TypeScript types; this describes the subset of its
// thrown error shape (`error.properties.errors[].properties.explanation`)
// that we read below.
interface DocxtemplaterError {
	message: string;
	properties?: {
		errors?: Array<{
			message: string;
			properties?: { explanation?: string };
		}>;
	};
}

export function renderCarePlan(
	templateBuffer: ArrayBuffer,
	data: unknown,
): Uint8Array {
	const zip = new PizZip(templateBuffer);
	const doc = new Docxtemplater(zip, {
		parser: expressionParser,
		paragraphLoop: true,
		linebreaks: true,
	});

	try {
		doc.render(data);
	} catch (error) {
		const docxError = error as DocxtemplaterError;
		const explanations = docxError.properties?.errors?.map(
			(e) => e.properties?.explanation ?? e.message,
		);
		throw new Error(explanations?.join("\n") ?? docxError.message);
	}

	return doc.getZip().generate({ type: "uint8array" });
}
