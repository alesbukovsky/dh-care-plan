import { defineConfig } from "tsup";

export default defineConfig({
	entry: { index: "src/index.ts", schema: "src/schema/index.ts" },
	format: ["esm"],
	target: "node18",
	dts: true,
	// Both entries pull in the schema modules. Splitting puts that shared code in a
	// chunk instead of copying it into each bundle, so importing `DEFAULT_CONFIG` from
	// the root and from `/schema` yields the same object rather than two rival copies.
	splitting: true,
	sourcemap: true,
	// Bundling is what makes extensionless source imports safe: no relative specifier
	// written by hand survives into the output for Node's ESM resolver to reject.
	treeshake: true,
	clean: true,
});
