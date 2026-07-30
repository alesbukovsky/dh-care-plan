import { defineConfig } from "tsdown";

export default defineConfig({
	entry: { index: "src/index.ts" },
	format: ["esm"],
	target: "node24",
	dts: true,
	fixedExtension: false,
	sourcemap: true,
	treeshake: true,
	clean: true,
});
