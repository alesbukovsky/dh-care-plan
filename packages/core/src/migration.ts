export type Migration = (data: unknown) => unknown;

export interface Migrated {
	version: number;
	data: unknown;
}

export function getVersion(data: unknown, fallback = 1): number {
	const ver = (data as { version?: unknown } | null | undefined)?.version;
	return typeof ver === "number" ? ver : fallback;
}

export function setVersion<T>(data: T, version: number): T {
	if (typeof data !== "object" || data === null) return data;
	return { ...data, version } as T;
}

export function migrateRange(
	data: unknown,
	from: number,
	to: number,
	migrations: Record<number, Migration>,
): Migrated | null {
	if (from > to) return null;

	let ver = from;
	let buf = data;
	while (ver < to) {
		const step = migrations[ver];
		if (!step) return null;
		buf = step(buf);
		ver += 1;
	}
	return { version: ver, data: buf };
}

export function migrate(
	data: unknown,
	to: number,
	migrations: Record<number, Migration>,
): Migrated | null {
	const res = migrateRange(data, getVersion(data), to, migrations);
	if (!res) return null;
	return { version: res.version, data: setVersion(res.data, res.version) };
}
