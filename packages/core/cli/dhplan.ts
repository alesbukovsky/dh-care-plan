#!/usr/bin/env bun
import { Argument, Command } from "commander";
import {
	buildTemplateData,
	getPlanSample,
	getPlanSchema,
	getTemplateSample,
	getTemplateSchema,
	Plan,
	render,
	validateData,
	validateTemplate,
} from "../src";

const SCHEMA_TYPES = ["plan", "template"] as const;
type SchemaType = (typeof SCHEMA_TYPES)[number];

const cli = new Command();

cli.name("dhplan").description("Dental hygiene care plan builder CLI");

cli
	.command("schema")
	.description("Print the JSON Schema for the data or template schema")
	.addArgument(new Argument("<type>", "which schema to print").choices(SCHEMA_TYPES))
	.option("--sample", "print an example JSON document instead of the schema")
	.action((type: SchemaType, options: { sample?: boolean }) => {
		if (options.sample) {
			const sample = type === "plan" ? getPlanSample() : getTemplateSample();
			console.log(JSON.stringify(sample, null, 2));
			return;
		}

		const schema = type === "plan" ? getPlanSchema() : getTemplateSchema();
		console.log(JSON.stringify(schema, null, 2));
	});

cli
	.command("validate")
	.description("Validate a data or template file against its schema")
	.addArgument(
		new Argument("<type>", "which schema to validate against").choices(SCHEMA_TYPES),
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

		const validate = type === "plan" ? validateData : validateTemplate;
		const result = validate(buffer);

		if (result.valid) {
			console.log(`${file} is valid`);
			return;
		}

		for (const issue of result.issues) {
			console.error(issue.path ? `${issue.path}: ${issue.message}` : issue.message);
		}
		process.exit(1);
	});

cli
	.command("render")
	.description("Render a plan into a final .docx using given template")
	.argument("<plan>", "path to the plan JSON file")
	.argument("<template>", "path to the .docx template")
	.argument("<output>", "path to write the rendered .docx")
	.action(async (planPath: string, templatePath: string, outputPath: string) => {
		let planBuffer: ArrayBuffer;
		let templateBuffer: ArrayBuffer;
		try {
			planBuffer = await Bun.file(planPath).arrayBuffer();
			templateBuffer = await Bun.file(templatePath).arrayBuffer();
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : String(error);
			console.error(`Failed to read input file: ${message}`);
			process.exit(1);
		}

		const result = render(planBuffer, templateBuffer);

		if (!result.success) {
			for (const issue of result.issues) {
				console.error(issue.path ? `${issue.path}: ${issue.message}` : issue.message);
			}
			process.exit(1);
		}

		await Bun.write(outputPath, result.output);
		console.log(`Wrote ${outputPath}`);
	});

cli
	.command("inspect")
	.description("Print template data generated from a plan")
	.argument("<plan>", "path to the plan JSON file")
	.action(async (planPath: string) => {
		let planBuffer: ArrayBuffer;
		try {
			planBuffer = await Bun.file(planPath).arrayBuffer();
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : String(error);
			console.error(`Failed to read ${planPath}: ${message}`);
			process.exit(1);
		}

		const planCheck = validateData(planBuffer);
		if (!planCheck.valid) {
			for (const issue of planCheck.issues) {
				console.error(issue.path ? `${issue.path}: ${issue.message}` : issue.message);
			}
			process.exit(1);
		}

		const plan = Plan.parse(JSON.parse(new TextDecoder().decode(planBuffer)));
		console.log(JSON.stringify(buildTemplateData(plan), null, 2));
	});

if (process.argv.length < 3) {
	cli.outputHelp();
	process.exit(1);
}

cli.parse();
