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

/**
 * Thrown once a problem has been reported, so the command unwinds to an exit
 * code without the caller having to thread one back out of every branch.
 */
class CliFailure extends Error {}

function printLine(io: CliIo, path: string, message: string): void {
	io.writeError(path ? `${path}: ${message}\n` : `${message}\n`);
}

/** Core hands back structured facts; the CLI is the one that turns them into text. */
function printParseIssues(io: CliIo, problem: ParseProblem): void {
	if (problem.reason === "json") {
		printLine(io, "", `Invalid JSON: ${problem.message}`);
		return;
	}
	for (const issue of problem.issues) {
		printLine(io, issue.path.join("."), issue.message);
	}
}

function printTemplateIssues(io: CliIo, issues: TemplateIssue[]): void {
	for (const issue of issues) {
		printLine(io, issue.path, issue.message);
	}
}

async function readFile(io: CliIo, path: string, label: string): Promise<ArrayBuffer> {
	try {
		const bytes = await readFileBytes(path);
		// Node hands back a Buffer over a pooled ArrayBuffer, so `bytes.buffer` on its own
		// would carry unrelated bytes. Slice out the window this file actually occupies.
		return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : String(error);
		io.writeError(`Failed to read ${label}: ${message}\n`);
		throw new CliFailure();
	}
}

/** Reads and parses a `--config` override, if one was given. */
async function readConfigOption(io: CliIo, path: string | undefined): Promise<Config | undefined> {
	if (!path) return undefined;

	const parsed = parseConfig(await readFile(io, path, path));
	if (!parsed.ok) {
		printParseIssues(io, parsed);
		throw new CliFailure();
	}
	return parsed.data;
}

function buildProgram(io: CliIo): Command {
	const cli = new Command();

	cli.name("dhplan").description("Dental hygiene care plan builder CLI");
	// Exiting is the caller's job, so the CLI stays runnable in-process.
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

			const document = options.sample ? samples[type]() : schemas[type]();
			io.write(`${JSON.stringify(document, null, 2)}\n`);
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
				printTemplateIssues(io, check.issues);
				throw new CliFailure();
			}

			const parsed = type === "plan" ? parsePlan(buffer) : parseConfig(buffer);
			if (parsed.ok) {
				io.write(`${file} is valid\n`);
				return;
			}
			printParseIssues(io, parsed);
			throw new CliFailure();
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
					printParseIssues(io, parsed);
					throw new CliFailure();
				}

				const config = await readConfigOption(io, options.config);

				// Checked separately so a bad tag is named precisely, rather than surfacing
				// as whatever docxtemplater says when it hits it mid-render.
				const check = checkTemplate(templateBuffer);
				if (!check.ok) {
					io.writeError("Failed to render output file\n");
					printTemplateIssues(io, check.issues);
					throw new CliFailure();
				}

				const result = render(parsed.data, templateBuffer, config);
				if (!result.ok) {
					io.writeError("Failed to render output file\n");
					printLine(io, "", result.message);
					throw new CliFailure();
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
				printParseIssues(io, parsed);
				throw new CliFailure();
			}

			const config = await readConfigOption(io, options.config);

			io.write(`${JSON.stringify(convertData(parsed.data, config), null, 2)}\n`);
		});

	return cli;
}

/** Runs one CLI invocation and returns the exit code it should produce. */
export async function runCli(args: string[], io: CliIo): Promise<number> {
	const cli = buildProgram(io);

	if (args.length === 0) {
		cli.outputHelp();
		return 1;
	}

	try {
		await cli.parseAsync(args, { from: "user" });
		return 0;
	} catch (error: unknown) {
		if (error instanceof CliFailure) return 1;
		// Commander has already reported bad usage, and asked-for help exits 0.
		if (error instanceof CommanderError) return error.exitCode;
		throw error;
	}
}

// Only when invoked as a command, so the tests can import `runCli` and drive it
// in-process. The exit code is set rather than exited on, so piped output is
// flushed before the process ends.
if (import.meta.main) {
	process.exitCode = await runCli(process.argv.slice(2), {
		write: (text) => process.stdout.write(text),
		writeError: (text) => process.stderr.write(text),
	});
}
