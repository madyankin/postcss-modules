import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "..");
const loaderPath = path.resolve(repoRoot, "build/loader.mjs");
const fixturesIn = path.resolve(__dirname, "./fixtures/in");

beforeAll(() => {
	if (!existsSync(loaderPath)) {
		throw new Error(
			`Loader build artifact missing at ${loaderPath}. Run \`make compile\` first.`,
		);
	}
});

function runLoaderScript(script, options = {}) {
	return execFileSync(
		process.execPath,
		["--import", loaderPath, "--input-type=module", "-e", script],
		{
			cwd: options.cwd || repoRoot,
			encoding: "utf8",
			env: { ...process.env, ...(options.env || {}) },
		},
	).trim();
}

it("returns the token map for a CSS file via JS import", () => {
	const cssPath = path.join(fixturesIn, "classes.css");
	const out = runLoaderScript(
		`import s from ${JSON.stringify(cssPath)}; process.stdout.write(JSON.stringify(s));`,
	);
	const tokens = JSON.parse(out);
	expect(Object.keys(tokens).sort()).toEqual(["article", "title"]);
	expect(tokens.title).toMatch(/title/);
});

it("composes tokens across imported CSS files", () => {
	const cssPath = path.join(fixturesIn, "composes.css");
	const out = runLoaderScript(
		`import s from ${JSON.stringify(cssPath)}; process.stdout.write(JSON.stringify(s));`,
	);
	const tokens = JSON.parse(out);
	expect(tokens).toHaveProperty("title");
	expect(tokens).toHaveProperty("figure");
	expect(tokens.title.split(/\s+/).length).toBeGreaterThanOrEqual(2);
	expect(tokens.figure.split(/\s+/).length).toBeGreaterThanOrEqual(2);
});

it("applies options from postcss-modules.config.cjs in cwd", () => {
	const dir = mkdtempSync(path.join(tmpdir(), "pcm-loader-"));
	try {
		writeFileSync(
			path.join(dir, "postcss-modules.config.cjs"),
			'module.exports = { generateScopedName: (name) => "_test_" + name };\n',
		);
		const cssPath = path.join(dir, "x.css");
		writeFileSync(cssPath, ".foo { color: red; }\n.bar { color: blue; }\n");
		const out = runLoaderScript(
			`import s from ${JSON.stringify(cssPath)}; process.stdout.write(JSON.stringify(s));`,
			{ cwd: dir },
		);
		expect(JSON.parse(out)).toEqual({ foo: "_test_foo", bar: "_test_bar" });
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
});

it("honors POSTCSS_MODULES_CONFIG env var", () => {
	const dir = mkdtempSync(path.join(tmpdir(), "pcm-loader-env-"));
	try {
		const configPath = path.join(dir, "my-config.cjs");
		writeFileSync(
			configPath,
			'module.exports = { generateScopedName: (name) => "_env_" + name };\n',
		);
		const cssPath = path.join(dir, "x.css");
		writeFileSync(cssPath, ".a {}\n.b {}\n");
		const out = runLoaderScript(
			`import s from ${JSON.stringify(cssPath)}; process.stdout.write(JSON.stringify(s));`,
			{ cwd: dir, env: { POSTCSS_MODULES_CONFIG: configPath } },
		);
		expect(JSON.parse(out)).toEqual({ a: "_env_a", b: "_env_b" });
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
});

it("surfaces missing-file errors with the source path", () => {
	const cssPath = path.join(fixturesIn, "does-not-exist.css");
	expect(() => {
		runLoaderScript(
			`import s from ${JSON.stringify(cssPath)}; process.stdout.write(JSON.stringify(s));`,
		);
	}).toThrow(/does-not-exist\.css/);
});
