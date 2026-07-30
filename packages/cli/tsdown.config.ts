import { defineConfig } from "tsdown";

export default defineConfig({
	entry: { dhplan: "src/dhplan.ts" },
	format: ["esm"],
	target: "node24",
	dts: false,
	fixedExtension: false,
	sourcemap: true,
	treeshake: true,
	clean: true,
});
