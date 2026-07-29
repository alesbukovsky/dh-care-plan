import { access, writeFile } from "node:fs/promises";

/** Writes JSON text or a `buildDocx` fixture, so callers can pass either without ceremony. */
export async function writeFixture(path: string, data: string | ArrayBuffer): Promise<void> {
	await writeFile(path, typeof data === "string" ? data : new Uint8Array(data));
}

/** True when the path exists, for asserting whether the CLI produced its output file. */
export async function fileExists(path: string): Promise<boolean> {
	try {
		await access(path);
		return true;
	} catch {
		return false;
	}
}
