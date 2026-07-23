import Docxtemplater from "docxtemplater";
import expressionParser from "docxtemplater/expressions.js";
import PizZip from "pizzip";

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
	} catch (error: any) {
		const explanations = error.properties?.errors?.map(
			(e: any) => e.properties?.explanation ?? e.message,
		);
		throw new Error(explanations?.join("\n") ?? error.message);
	}

	return doc.getZip().generate({ type: "uint8array" });
}
