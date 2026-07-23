import { join } from "node:path";

const CLI_PATH = join(import.meta.dir, "../../cli/dhplan.ts");

export async function runCli(args: string[]) {
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
