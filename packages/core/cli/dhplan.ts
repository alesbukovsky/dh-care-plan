#!/usr/bin/env bun
import { Argument, Command } from "commander";
import { z } from "zod";
import {
	DataSchema,
	TemplateSchema,
	validateData,
	validateTemplate,
} from "../src";

const SCHEMA_TYPES = ["data", "template"] as const;
type SchemaType = (typeof SCHEMA_TYPES)[number];

const cli = new Command();

cli.name("dhplan").description("Dental hygiene care plan builder CLI");

cli
	.command("schema")
	.description("Print the JSON Schema for the data or template schema")
	.addArgument(
		new Argument("<type>", "which schema to print").choices(SCHEMA_TYPES),
	)
	.action((type: SchemaType) => {
		const schema = type === "data" ? DataSchema : TemplateSchema;
		console.log(JSON.stringify(z.toJSONSchema(schema), null, 2));
	});

cli
	.command("validate")
	.description("Validate a data or template file against its schema")
	.addArgument(
		new Argument("<type>", "which schema to validate against").choices(
			SCHEMA_TYPES,
		),
	)
	.argument("<file>", "path to the file to validate")
	.action(async (type: SchemaType, file: string) => {
		let buffer: ArrayBuffer;
		try {
			buffer = await Bun.file(file).arrayBuffer();
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : String(error);
			console.error(`Failed to read ${file}: ${message}`);
			process.exit(1);
		}

		const validate = type === "data" ? validateData : validateTemplate;
		const result = validate(buffer);

		if (result.valid) {
			console.log(`${file} is valid`);
			return;
		}

		for (const issue of result.issues) {
			console.error(
				issue.path ? `${issue.path}: ${issue.message}` : issue.message,
			);
		}
		process.exit(1);
	});

// Placeholder: render logic kept for reference until the data→template
// conversion is designed and this is re-wired as a real command.
//
// import { renderCarePlan } from "../src";
//
// program
// 	.command("render")
// 	.argument("<template>", "path to the .docx template")
// 	.argument("<data>", "path to the data JSON file")
// 	.argument("<output>", "path to write the rendered .docx")
// 	.action(async (templatePath: string, dataPath: string, outputPath: string) => {
// 		const templateBuffer = await Bun.file(templatePath).arrayBuffer();
// 		const data = await Bun.file(dataPath).json();
//
// 		try {
// 			const output = renderCarePlan(templateBuffer, data);
// 			await Bun.write(outputPath, output);
// 		} catch (error: any) {
// 			console.error(error.message);
// 			process.exit(1);
// 		}
//
// 		console.log(`Wrote ${outputPath}`);
// 	});

if (process.argv.length < 3) {
	cli.outputHelp();
	process.exit(1);
}

cli.parse();
