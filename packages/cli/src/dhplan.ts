#!/usr/bin/env node
import { readFile as readFileBytes, writeFile } from "node:fs/promises";
import type { Config, ParseResult, TemplateIssue } from "@dh-care-plan/core";
import {
	checkTemplate,
	convertData,
	getConfigSample,
	getConfigSchema,
	getPlanSample,
	getPlanSchema,
	getTemplateSample,
	getTemplateSchema,
	parseConfig,
	parsePlan,
	render,
} from "@dh-care-plan/core";
import { Argument, Command, CommanderError } from "commander";

const SCHEMA_TYPES = ["plan", "template", "config"] as const;
type SchemaType = (typeof SCHEMA_TYPES)[number];

type ParseProblem = Extract<ParseResult<unknown>, { ok: false }>;

export interface CliIo {
	write(text: string): void;
	writeError(text: string): void;
}

class CliError extends Error {}

function writeError(io: CliIo, path: string, message: string): void {
	io.writeError(path ? `${path}: ${message}\n` : `${message}\n`);
}

function writeParseProblem(io: CliIo, problem: ParseProblem): void {
	if (problem.reason === "json") {
		io.writeError(`Invalid JSON: ${problem.message}\n`);
		return;
	}
	for (const issue of problem.issues) {
		writeError(io, issue.path.join("."), issue.message);
	}
}

function writeTemplateIssues(io: CliIo, issues: TemplateIssue[]): void {
	for (const issue of issues) {
		writeError(io, issue.path, issue.message);
	}
}

async function readFile(io: CliIo, path: string, label: string): Promise<Uint8Array> {
	try {
		return await readFileBytes(path);
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : String(err);
		io.writeError(`Failed to read ${label}: ${message}\n`);
		throw new CliError();
	}
}

async function readConfig(io: CliIo, path: string | undefined): Promise<Config | undefined> {
	if (!path) return undefined;

	const parsed = parseConfig(await readFile(io, path, path));
	if (!parsed.ok) {
		writeParseProblem(io, parsed);
		throw new CliError();
	}
	return parsed.data;
}

function buildCli(io: CliIo): Command {
	const cli = new Command();

	cli.name("dhplan").description("Dental hygiene care plan builder CLI");
	cli.exitOverride();
	cli.configureOutput({
		writeOut: (text) => io.write(text),
		writeErr: (text) => io.writeError(text),
	});

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

			const doc = options.sample ? samples[type]() : schemas[type]();
			io.write(`${JSON.stringify(doc, null, 2)}\n`);
		});

	cli
		.command("validate")
		.description("Validate a data or template file against its schema")
		.addArgument(new Argument("<type>", "which schema to validate against").choices(SCHEMA_TYPES))
		.argument("<file>", "path to the file to validate")
		.action(async (type: SchemaType, file: string) => {
			const buffer = await readFile(io, file, file);

			if (type === "template") {
				const check = checkTemplate(buffer);
				if (check.ok) {
					io.write(`${file} is valid\n`);
					return;
				}
				writeTemplateIssues(io, check.issues);
				throw new CliError();
			}

			const parsed = type === "plan" ? parsePlan(buffer) : parseConfig(buffer);
			if (parsed.ok) {
				io.write(`${file} is valid\n`);
				return;
			}
			writeParseProblem(io, parsed);
			throw new CliError();
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
				const planBuffer = await readFile(io, planPath, planPath);
				const templateBuffer = await readFile(io, templatePath, templatePath);

				const parsed = parsePlan(planBuffer);
				if (!parsed.ok) {
					writeParseProblem(io, parsed);
					throw new CliError();
				}

				const config = await readConfig(io, options.config);

				const check = checkTemplate(templateBuffer);
				if (!check.ok) {
					io.writeError("Failed to render output file\n");
					writeTemplateIssues(io, check.issues);
					throw new CliError();
				}

				const result = render(parsed.data, templateBuffer, config);
				if (!result.ok) {
					io.writeError("Failed to render output file\n");
					io.writeError(`${result.message}\n`);
					throw new CliError();
				}

				await writeFile(outputPath, result.output);
				io.write(`Wrote ${outputPath}\n`);
			},
		);

	cli
		.command("inspect")
		.description("Print template data generated from a plan")
		.argument("<plan>", "path to the plan JSON file")
		.option("--config <file>", "path to a config override JSON file")
		.action(async (planPath: string, options: { config?: string }) => {
			const parsed = parsePlan(await readFile(io, planPath, planPath));
			if (!parsed.ok) {
				writeParseProblem(io, parsed);
				throw new CliError();
			}

			const config = await readConfig(io, options.config);

			io.write(`${JSON.stringify(convertData(parsed.data, config), null, 2)}\n`);
		});

	return cli;
}

export async function runCli(args: string[], io: CliIo): Promise<number> {
	const cli = buildCli(io);

	if (args.length === 0) {
		cli.outputHelp();
		return 1;
	}

	try {
		await cli.parseAsync(args, { from: "user" });
		return 0;
	} catch (err: unknown) {
		if (err instanceof CliError) return 1;
		if (err instanceof CommanderError) return err.exitCode;
		throw err;
	}
}

if (import.meta.main) {
	process.exitCode = await runCli(process.argv.slice(2), {
		write: (text) => process.stdout.write(text),
		writeError: (text) => process.stderr.write(text),
	});
}
