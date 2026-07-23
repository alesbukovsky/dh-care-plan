#!/usr/bin/env bun
import { renderCarePlan } from "../src";

const [templatePath, dataPath, outputPath] = process.argv.slice(2);

if (!templatePath || !dataPath || !outputPath) {
	console.error("Usage: dhplan <template.docx> <data.json> <output.docx>");
	process.exit(1);
}

const templateBuffer = await Bun.file(templatePath).arrayBuffer();
const data = await Bun.file(dataPath).json();

try {
	const output = renderCarePlan(templateBuffer, data);
	await Bun.write(outputPath, output);
} catch (error: any) {
	console.error(error.message);
	process.exit(1);
}

console.log(`Wrote ${outputPath}`);
