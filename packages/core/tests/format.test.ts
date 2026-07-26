import { describe, expect, test } from "bun:test";
import { formatDate } from "../src/format";

describe("formatDate", () => {
	test("formats using MM/DD/YYYY", () => {
		expect(formatDate("1990-05-03", "MM/DD/YYYY")).toBe("05/03/1990");
	});

	test("formats using DD.MM.YYYY", () => {
		expect(formatDate("1990-05-03", "DD.MM.YYYY")).toBe("03.05.1990");
	});

	test("formats using YYYY-MM-DD (identity)", () => {
		expect(formatDate("1990-05-03", "YYYY-MM-DD")).toBe("1990-05-03");
	});

	test("passes through literal separators unmodified", () => {
		expect(formatDate("1990-05-03", "MM/DD/YYYY (literal)")).toBe("05/03/1990 (literal)");
	});
});
