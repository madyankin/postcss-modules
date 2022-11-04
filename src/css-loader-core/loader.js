// Initially copied from https://github.com/css-modules/css-modules-loader-core

import postcss from "postcss";
import fs from "fs";
import path from "path";

import Parser from "./parser";

class Core {
	constructor(plugins) {
		this.plugins = plugins || Core.defaultPlugins;
	}

	async load(sourceString, sourcePath, trace, pathFetcher) {
		const parser = new Parser(pathFetcher, trace);
		const plugins = this.plugins.concat([parser.plugin()]);

		const result = await postcss(plugins).process(sourceString, {
			from: sourcePath,
		});

		return {
			injectableSource: result,
			exportTokens: parser.exportTokens,
		};
	}
}

// Sorts dependencies in the following way:
// AAA comes before AA and A
// AB comes after AA and before A
// All Bs come after all As
// This ensures that the files are always returned in the following order:
// - In the order they were required, except
// - After all their dependencies
const traceKeySorter = (a, b) => {
	if (a.length < b.length) {
		return a < b.substring(0, a.length) ? -1 : 1;
	}

	if (a.length > b.length) {
		return a.substring(0, b.length) <= b ? -1 : 1;
	}

	return a < b ? -1 : 1;
};

export default class FileSystemLoader {
	constructor(root, plugins, fileResolve) {
		if (root === "/" && process.platform === "win32") {
			const cwdDrive = process.cwd().slice(0, 3);
			if (!/^[A-Za-z]:\\$/.test(cwdDrive)) {
				throw new Error(`Failed to obtain root from "${process.cwd()}".`);
			}
			root = cwdDrive;
		}

		this.root = root;
		this.fileResolve = fileResolve;
		this.sources = {};
		this.traces = {};
		this.importNr = 0;
		this.core = new Core(plugins);
		this.tokensByFile = {};
	}

	async fetch(_newPath, relativeTo, _trace) {
		const newPath = _newPath.replace(/^["']|["']$/g, "");
		const trace = _trace || String.fromCharCode(this.importNr++);
		const useFileResolve = typeof this.fileResolve === "function";

		const fileResolvedPath = useFileResolve
			? await this.fileResolve(newPath, relativeTo)
			: await Promise.resolve();

		if (fileResolvedPath && !path.isAbsolute(fileResolvedPath)) {
			throw new Error('The returned path from the "fileResolve" option must be absolute.');
		}

		const relativeDir = path.dirname(relativeTo);

		const rootRelativePath = fileResolvedPath || path.resolve(relativeDir, newPath);

		let fileRelativePath =
			fileResolvedPath || path.resolve(path.resolve(this.root, relativeDir), newPath);

		// if the path is not relative or absolute, try to resolve it in node_modules
		if (!useFileResolve && newPath[0] !== "." && !path.isAbsolute(newPath)) {
			try {
				fileRelativePath = require.resolve(newPath);
			} catch (e) {
				// noop
			}
		}

		const tokens = this.tokensByFile[fileRelativePath];
		if (tokens) return tokens;

		return new Promise((resolve, reject) => {
			fs.readFile(fileRelativePath, "utf-8", async (err, source) => {
				if (err) reject(err);

				const { injectableSource, exportTokens } = await this.core.load(
					source,
					rootRelativePath,
					trace,
					this.fetch.bind(this)
				);

				this.sources[fileRelativePath] = injectableSource;
				this.traces[trace] = fileRelativePath;
				this.tokensByFile[fileRelativePath] = exportTokens;
				resolve(exportTokens);
			});
		});
	}

	get finalSource() {
		const traces = this.traces;
		const sources = this.sources;
		let written = new Set();

		return Object.keys(traces)
			.sort(traceKeySorter)
			.map((key) => {
				const filename = traces[key];
				if (written.has(filename)) {
					return null;
				}
				written.add(filename);

				return sources[filename].root
			}).filter(Boolean);
	}
}
