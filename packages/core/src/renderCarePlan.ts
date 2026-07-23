import { createTemplater, describeTemplaterError } from "./templater";

export function renderCarePlan(
	templateBuffer: ArrayBuffer,
	data: unknown,
): Uint8Array {
	const doc = createTemplater(templateBuffer);

	try {
		doc.render(data);
	} catch (error) {
		throw new Error(describeTemplaterError(error));
	}

	return doc.getZip().generate({ type: "uint8array" });
}
