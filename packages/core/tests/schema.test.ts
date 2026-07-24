import { describe, expect, test } from "bun:test";
import { getPlanSample, getTemplateSample, Plan, Template } from "../src";

describe("getPlanSample", () => {
	test("is valid against Plan", () => {
		expect(() => Plan.parse(getPlanSample())).not.toThrow();
	});
});

describe("getTemplateSample", () => {
	test("is valid against Template", () => {
		expect(() => Template.parse(getTemplateSample())).not.toThrow();
	});
});
