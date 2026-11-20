import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "..");

function processFiles(files, entries = ["a.css"]) {
	const directory = mkdtempSync(path.join(tmpdir(), "postcss-modules-circular-"));
	try {
		for (const [name, source] of Object.entries(files)) {
			writeFileSync(path.join(directory, name), source);
		}

		// A regression must not leave recursive imports running in the test process.
		const script = `
			const fs = require("node:fs");
			const path = require("node:path");
			const postcss = require(${JSON.stringify(require.resolve("postcss"))});
			const modules = require(${JSON.stringify(path.join(repoRoot, "build"))});
			const directory = ${JSON.stringify(directory)};
			const processor = postcss([modules({ generateScopedName: name => "_" + name, getJSON() {} })]);
			Promise.all(${JSON.stringify(entries)}.map(async name => {
				const from = path.join(directory, name);
				try {
					const result = await processor.process(fs.readFileSync(from, "utf8"), { from });
					return {
						css: result.css,
						tokens: result.messages.find(message => message.type === "export").exportTokens,
						dependencies: result.messages.filter(message => message.type === "dependency")
							.map(message => path.basename(message.file))
					};
				} catch (error) {
					return { error: error.message.split(directory + path.sep).join("") };
				}
			})).then(results => process.stdout.write(JSON.stringify(results)));
		`;
		const result = spawnSync(process.execPath, ["--max-old-space-size=128", "-e", script], {
			cwd: repoRoot,
			encoding: "utf8",
			timeout: 5000,
		});
		expect(result.error).toBeUndefined();
		expect(result.status).toBe(0);
		return JSON.parse(result.stdout);
	} finally {
		rmSync(directory, { recursive: true, force: true });
	}
}

it.each([
	[
		"composes",
		{
			"a.css": '.a { composes: b from "./b.css"; }',
			"b.css": '.b { composes: a from "./a.css"; }',
		},
		"b.css -> a.css -> b.css",
	],
	[
		"@value",
		{
			"a.css": '@value b from "./b.css"; @value a: b;',
			"b.css": '@value a from "./a.css"; @value b: a;',
		},
		"b.css -> a.css -> b.css",
	],
	["a self-import", { "a.css": '.a { composes: a from "./a.css"; }' }, "a.css -> a.css"],
	[
		"a nested cycle",
		{
			"a.css": '.a { composes: b from "./b.css"; }',
			"b.css": '.b { composes: c from "./c.css"; }',
			"c.css": '.c { composes: b from "./b.css"; }',
		},
		"b.css -> c.css -> b.css",
	],
])("rejects circular imports through %s", (_name, files, chain) => {
	expect(processFiles(files)).toEqual([{ error: `Circular dependency: ${chain}` }]);
});

it("allows branches to import the same dependency concurrently", () => {
	const [result] = processFiles({
		"a.css": '.a { composes: b from "./b.css"; composes: c from "./c.css"; }',
		"b.css": '.b { composes: d from "./d.css"; color: red; }',
		"c.css": '.c { composes: d from "./d.css"; color: blue; }',
		"d.css": ".d { display: block; }",
	});

	expect(result.tokens).toEqual({ a: "_a _b _d _c _d" });
	expect(result.dependencies).toEqual(["d.css", "b.css", "c.css"]);
	expect(result.css.match(/display: block/g)).toHaveLength(1);
});

it("keeps concurrent entry points independent", () => {
	const results = processFiles(
		{
			"a.css": '.a { composes: shared from "./shared.css"; }',
			"b.css": '.b { composes: shared from "./shared.css"; }',
			"shared.css": ".shared { color: red; }",
		},
		["a.css", "b.css"],
	);

	expect(results.map((result) => result.tokens)).toEqual([
		{ a: "_a _shared" },
		{ b: "_b _shared" },
	]);
	expect(results.map((result) => result.dependencies)).toEqual([["shared.css"], ["shared.css"]]);
});
