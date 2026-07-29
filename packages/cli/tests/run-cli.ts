import { execFile } from "node:child_process";
import { join } from "node:path";
import { promisify } from "node:util";
import { runCli as runProgram } from "../src/dhplan";

const execFileAsync = promisify(execFile);

/**
 * The built entry point, not the source. `runCliProcess` is about what a user gets from an
 * install, and plain Node cannot run TypeScript, so this needs `pnpm build:cli` to have run.
 */
const CLI_PATH = join(import.meta.dirname, "../dist/dhplan.js");

export interface CliRun {
	stdout: string;
	stderr: string;
	exitCode: number;
}

/**
 * Runs the CLI in this process, so what it does counts as covered code.
 * `runCliProcess` covers the wiring that only exists in a real invocation.
 */
export async function runCli(args: string[]): Promise<CliRun> {
	let stdout = "";
	let stderr = "";

	const exitCode = await runProgram(args, {
		write: (text) => {
			stdout += text;
		},
		writeError: (text) => {
			stderr += text;
		},
	});

	return { stdout, stderr, exitCode };
}

/** Runs the installed entry point as a subprocess, the way a user would. */
export async function runCliProcess(args: string[]): Promise<CliRun> {
	try {
		const { stdout, stderr } = await execFileAsync(process.execPath, [CLI_PATH, ...args]);
		return { stdout, stderr, exitCode: 0 };
	} catch (error) {
		// A non-zero exit rejects, but the output and the code are what the test is asserting on.
		const failure = error as { stdout?: string; stderr?: string; code?: number };
		return {
			stdout: failure.stdout ?? "",
			stderr: failure.stderr ?? "",
			exitCode: failure.code ?? 1,
		};
	}
}
