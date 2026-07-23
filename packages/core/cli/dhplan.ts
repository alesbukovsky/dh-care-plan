#!/usr/bin/env bun
import { Argument, Command } from "commander";
import { z } from "zod";
import { DataSchema, TemplateSchema } from "../src";

const cli = new Command();

cli.name("dhplan").description("Dental hygiene care plan builder CLI");

cli
	.command("schema")
	.description("Print the JSON Schema for the data or template schema")
	.addArgument(
		new Argument("<target>", "which schema to print").choices([
			"data",
			"template",
		]),
	)
	.action((target: "data" | "template") => {
		const schema = target === "data" ? DataSchema : TemplateSchema;
		console.log(JSON.stringify(z.toJSONSchema(schema), null, 2));
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
