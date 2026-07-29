import { defineConfig } from "tsup";

export default defineConfig({
	entry: { dhplan: "src/dhplan.ts" },
	format: ["esm"],
	// `import.meta.main` in the entry guard needs Node 24, which is also the package's
	// declared floor. Keep the two in step.
	target: "node24",
	dts: false,
	sourcemap: true,
	treeshake: true,
	clean: true,
});
