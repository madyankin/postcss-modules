import fs from "fs";
import os from "os";
import path from "path";
import FileSystemLoader from "../src/FileSystemLoader";
import { behaviours, getDefaultPlugins } from "../src/scoping";

const nodeFileSystem = {
	readFile: fs.readFile,
	realpath: fs.realpath,
	writeFile: fs.writeFile,
};

function makePlugins() {
	return getDefaultPlugins({
		behaviour: behaviours.LOCAL,
		generateScopedName: (name) => `_${name}`,
		exportGlobals: false,
	});
}

function writeCSS(directory, name, source = `.${name} {}`) {
	const filename = path.join(directory, `${name}.css`);
	fs.writeFileSync(filename, source);
	return filename;
}

describe("FileSystemLoader compatibility", () => {
	let directory;

	beforeEach(() => {
		directory = fs.mkdtempSync(path.join(os.tmpdir(), "postcss-modules-loader-"));
	});

	afterEach(() => {
		fs.rmSync(directory, { recursive: true, force: true });
	});

	it("resolves relative imports from the importing file", async () => {
		const entry = writeCSS(directory, "entry");
		const dependency = writeCSS(directory, "dependency");
		const loader = new FileSystemLoader("/", makePlugins(), undefined, nodeFileSystem);

		await expect(loader.fetch("./dependency.css", entry, "A")).resolves.toEqual({
			dependency: "_dependency",
		});
		expect(loader.finalSources).toEqual([{ file: dependency, source: "._dependency {}" }]);
	});

	it("uses an absolute path returned by a custom resolver", async () => {
		const entry = writeCSS(directory, "entry");
		const dependency = writeCSS(directory, "resolved");
		const resolve = jest.fn(async () => dependency);
		const loader = new FileSystemLoader("/ignored", makePlugins(), resolve, nodeFileSystem);

		await loader.fetch("alias", entry, "A");

		expect(resolve).toHaveBeenCalledWith("alias", entry);
		expect(loader.finalSources).toEqual([{ file: dependency, source: "._resolved {}" }]);
	});

	it("rejects a relative path returned by a custom resolver", async () => {
		const entry = writeCSS(directory, "entry");
		const loader = new FileSystemLoader(
			"/",
			makePlugins(),
			async () => "relative.css",
			nodeFileSystem,
		);

		await expect(loader.fetch("alias", entry, "A")).rejects.toThrow(
			'The returned path from the "fileResolve" option must be absolute.',
		);
	});

	it("resolves bare specifiers through Node module resolution", async () => {
		const entry = writeCSS(directory, "entry");
		const specifier = "istanbul-reports/lib/html/assets/base.css";
		const dependency = require.resolve(specifier);
		const loader = new FileSystemLoader("/", makePlugins(), undefined, nodeFileSystem);

		await loader.fetch(specifier, entry, "A");

		expect(loader.dependencies).toEqual([dependency]);
	});

	it("processes a duplicate import once and returns cached tokens", async () => {
		const entry = writeCSS(directory, "entry");
		const dependency = writeCSS(directory, "dependency");
		let dependencyReads = 0;
		const fileSystem = {
			...nodeFileSystem,
			readFile(filename, ...args) {
				if (filename === dependency) dependencyReads += 1;
				return fs.readFile(filename, ...args);
			},
		};
		const loader = new FileSystemLoader("/", makePlugins(), undefined, fileSystem);

		const first = await loader.fetch("./dependency.css", entry, "A");
		const second = await loader.fetch("./dependency.css", entry, "B");

		expect(second).toBe(first);
		expect(dependencyReads).toBe(1);
		expect(loader.finalSources).toHaveLength(1);
	});

	it("detects a cycle through a symlinked directory", async () => {
		const entry = writeCSS(directory, "a", '.a { composes: a from "./alias/a.css"; }');
		fs.symlinkSync(
			directory,
			path.join(directory, "alias"),
			process.platform === "win32" ? "junction" : "dir",
		);
		const loader = new FileSystemLoader("/", makePlugins(), undefined, nodeFileSystem);

		await expect(loader.fetch("./alias/a.css", entry, "A")).rejects.toThrow(
			/Circular dependency: .*alias[/\\]a\.css -> .*alias[/\\]alias[/\\]a\.css/,
		);
	});

	it("orders nested dependencies before importers and keeps all projections aligned", async () => {
		const entry = writeCSS(directory, "entry");
		const importer = writeCSS(directory, "importer", ".importer { order: importer; }");
		const nested = writeCSS(directory, "nested", ".nested { order: nested; }");
		const sibling = writeCSS(directory, "sibling", ".sibling { order: sibling; }");
		const loader = new FileSystemLoader("/", makePlugins(), undefined, nodeFileSystem);

		await loader.fetch(nested, entry, "AA");
		await loader.fetch(sibling, entry, "AB");
		await loader.fetch(importer, entry, "A");

		expect(loader.finalSources.map(({ file }) => file)).toEqual([nested, sibling, importer]);
		expect(loader.dependencies).toEqual([nested, sibling, importer]);
		expect(loader.finalSource).toBe(loader.finalSources.map(({ source }) => source).join(""));
	});
});
