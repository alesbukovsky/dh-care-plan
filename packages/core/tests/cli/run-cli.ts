import { join } from "node:path";
import { runCli as runProgram } from "../../cli/program";

const CLI_PATH = join(import.meta.dir, "../../cli/dhplan.ts");

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
	const proc = Bun.spawn(["bun", CLI_PATH, ...args], {
		stdout: "pipe",
		stderr: "pipe",
	});
	const [stdout, stderr, exitCode] = await Promise.all([
		new Response(proc.stdout).text(),
		new Response(proc.stderr).text(),
		proc.exited,
	]);
	return { stdout, stderr, exitCode };
}
