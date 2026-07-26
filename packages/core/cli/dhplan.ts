#!/usr/bin/env bun
import { Argument, Command } from "commander";
import type { Config } from "../src";
import {
	buildTemplateData,
	getConfigSample,
	getConfigSchema,
	getPlanSample,
	getPlanSchema,
	getTemplateSample,
	getTemplateSchema,
	Plan,
	render,
	resolveConfig,
	validateConfig,
	validateData,
	validateTemplate,
} from "../src";

const SCHEMA_TYPES = ["plan", "template", "config"] as const;
type SchemaType = (typeof SCHEMA_TYPES)[number];

const cli = new Command();

cli.name("dhplan").description("Dental hygiene care plan builder CLI");

cli
	.command("schema")
	.description("Print the JSON Schema for the data or template schema")
	.addArgument(new Argument("<type>", "which schema to print").choices(SCHEMA_TYPES))
	.option("--sample", "print an example JSON document instead of the schema")
	.action((type: SchemaType, options: { sample?: boolean }) => {
		const samples = {
			plan: getPlanSample,
			template: getTemplateSample,
			config: getConfigSample,
		};
		const schemas = {
			plan: getPlanSchema,
			template: getTemplateSchema,
			config: getConfigSchema,
		};

		if (options.sample) {
			console.log(JSON.stringify(samples[type](), null, 2));
			return;
		}

		console.log(JSON.stringify(schemas[type](), null, 2));
	});

cli
	.command("validate")
	.description("Validate a data or template file against its schema")
	.addArgument(new Argument("<type>", "which schema to validate against").choices(SCHEMA_TYPES))
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

		const validators = {
			plan: validateData,
			template: validateTemplate,
			config: validateConfig,
		};
		const result = validators[type](buffer);

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
	.option("--config <file>", "path to a config override JSON file")
	.action(
		async (
			planPath: string,
			templatePath: string,
			outputPath: string,
			options: { config?: string },
		) => {
			let planBuffer: ArrayBuffer;
			let templateBuffer: ArrayBuffer;
			let configBuffer: ArrayBuffer | undefined;
			try {
				planBuffer = await Bun.file(planPath).arrayBuffer();
				templateBuffer = await Bun.file(templatePath).arrayBuffer();
				if (options.config) {
					configBuffer = await Bun.file(options.config).arrayBuffer();
				}
			} catch (error: unknown) {
				const message = error instanceof Error ? error.message : String(error);
				console.error(`Failed to read input file: ${message}`);
				process.exit(1);
			}

			const result = render(planBuffer, templateBuffer, configBuffer);

			if (!result.success) {
				for (const issue of result.issues) {
					console.error(issue.path ? `${issue.path}: ${issue.message}` : issue.message);
				}
				process.exit(1);
			}

			await Bun.write(outputPath, result.output);
			console.log(`Wrote ${outputPath}`);
		},
	);

cli
	.command("inspect")
	.description("Print template data generated from a plan")
	.argument("<plan>", "path to the plan JSON file")
	.option("--config <file>", "path to a config override JSON file")
	.action(async (planPath: string, options: { config?: string }) => {
		let planBuffer: ArrayBuffer;
		let configBuffer: ArrayBuffer | undefined;
		try {
			planBuffer = await Bun.file(planPath).arrayBuffer();
			if (options.config) {
				configBuffer = await Bun.file(options.config).arrayBuffer();
			}
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : String(error);
			console.error(`Failed to read input file: ${message}`);
			process.exit(1);
		}

		const planCheck = validateData(planBuffer);
		if (!planCheck.valid) {
			for (const issue of planCheck.issues) {
				console.error(issue.path ? `${issue.path}: ${issue.message}` : issue.message);
			}
			process.exit(1);
		}

		let config: Config | undefined;
		if (configBuffer) {
			const configCheck = validateConfig(configBuffer);
			if (!configCheck.valid) {
				for (const issue of configCheck.issues) {
					console.error(issue.path ? `${issue.path}: ${issue.message}` : issue.message);
				}
				process.exit(1);
			}
			config = resolveConfig(JSON.parse(new TextDecoder().decode(configBuffer)));
		}

		const plan = Plan.parse(JSON.parse(new TextDecoder().decode(planBuffer)));
		console.log(JSON.stringify(buildTemplateData(plan, config), null, 2));
	});

if (process.argv.length < 3) {
	cli.outputHelp();
	process.exit(1);
}

cli.parse();
