import { describe, expect, test } from "vitest";
import { getVersion, migrate, migrateRange, setVersion } from "../src/migration";

describe("migrateRange", () => {
	test("data saved at the current version passes through unchanged", () => {
		expect(migrateRange({ a: 1 }, 2, 2, {})).toEqual({ version: 2, data: { a: 1 } });
	});

	test("each step's migration runs in order up to the target version", () => {
		const migrations = {
			1: (data: unknown) => ({ ...(data as object), b: "added at v1->v2" }),
			2: (data: unknown) => ({ ...(data as object), c: "added at v2->v3" }),
		};

		expect(migrateRange({ a: 1 }, 1, 3, migrations)).toEqual({
			version: 3,
			data: { a: 1, b: "added at v1->v2", c: "added at v2->v3" },
		});
	});

	test("a missing migration step returns null instead of guessing", () => {
		expect(migrateRange({ a: 1 }, 1, 3, { 2: (data) => data })).toBeNull();
	});

	test("data saved under a version newer than the target returns null", () => {
		expect(migrateRange({ a: 1 }, 5, 2, {})).toBeNull();
	});
});

describe("getVersion", () => {
	test("reads a numeric version field", () => {
		expect(getVersion({ version: 3 })).toBe(3);
	});

	test("falls back to 1 when the field is missing", () => {
		expect(getVersion({ a: 1 })).toBe(1);
	});

	test("falls back to a custom fallback when given one", () => {
		expect(getVersion({ a: 1 }, 5)).toBe(5);
	});

	test("falls back when the field isn't a number, or the input isn't an object", () => {
		expect(getVersion({ version: "3" })).toBe(1);
		expect(getVersion(null)).toBe(1);
		expect(getVersion(undefined)).toBe(1);
	});
});

describe("setVersion", () => {
	test("sets version on an object", () => {
		expect(setVersion({ a: 1 }, 4)).toEqual({ a: 1, version: 4 });
	});

	test("leaves a non-object value alone", () => {
		expect(setVersion(null, 4)).toBeNull();
		expect(setVersion("x", 4)).toBe("x");
	});
});

describe("migrate", () => {
	test("reads the version off the data itself and migrates to the target", () => {
		const migrations = { 1: (data: unknown) => ({ ...(data as object), upgraded: true }) };

		expect(migrate({ version: 1, a: 1 }, 2, migrations)).toEqual({
			version: 2,
			data: { a: 1, upgraded: true, version: 2 },
		});
	});

	test("assumes version 1 when the data has no version field", () => {
		const migrations = { 1: (data: unknown) => ({ ...(data as object), upgraded: true }) };

		expect(migrate({ a: 1 }, 2, migrations)).toEqual({
			version: 2,
			data: { a: 1, upgraded: true, version: 2 },
		});
	});

	test("returns null instead of guessing when it can't reach the target version", () => {
		expect(migrate({ version: 99 }, 2, {})).toBeNull();
	});
});
