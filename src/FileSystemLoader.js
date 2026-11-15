// Initially copied from https://github.com/css-modules/css-modules-loader-core

import DependencyStore from "./DependencyStore";
import { createImportedCSSProcessor } from "./processImportedCSS";
import { normalizeRoot, resolveImport } from "./resolveImport";

export default class FileSystemLoader {
	#fileResolve;
	#fileSystem;
	#nextImportIndex = 0;
	#processImportedCSS;
	#root;
	#store;

	constructor(root, plugins, fileResolve, fileSystem) {
		this.#root = normalizeRoot(root);
		this.#fileResolve = fileResolve;
		this.#processImportedCSS = createImportedCSSProcessor(plugins);
		this.#store = new DependencyStore();
		this.#fileSystem = fileSystem;
	}

	async fetch(_request, relativeTo, _dependencyPath) {
		const request = this.#normalizeRequest(_request);
		const dependencyPath = this.#getOrCreateDependencyPath(_dependencyPath);
		const { filePath, sourcePath } = await this.#resolvePaths(request, relativeTo);
		const cachedTokens = this.#store.getTokens(filePath);
		if (cachedTokens) return cachedTokens;

		const source = await this.#readFile(filePath);
		const result = await this.#processSource(source, sourcePath, dependencyPath);
		this.#recordDependency(filePath, dependencyPath, result);

		const { exportTokens } = result;
		return exportTokens;
	}

	get finalSources() {
		return this.#store.finalSources;
	}

	// Files read through `composes` and `@value` imports, including nested ones,
	// in the order their CSS is prepended.
	get dependencies() {
		return this.#store.dependencies;
	}

	get finalSource() {
		return this.#store.finalSource;
	}

	#normalizeRequest(request) {
		return request.replace(/^["']|["']$/g, "");
	}

	#getOrCreateDependencyPath(dependencyPath) {
		return dependencyPath || String.fromCharCode(this.#nextImportIndex++);
	}

	#resolvePaths(request, relativeTo) {
		return resolveImport({
			request,
			relativeTo,
			root: this.#root,
			fileResolve: this.#fileResolve,
		});
	}

	#readFile(filePath) {
		return new Promise((resolve, reject) => {
			this.#fileSystem.readFile(filePath, "utf-8", (error, contents) => {
				if (error) reject(error);
				else resolve(contents);
			});
		});
	}

	#processSource(source, sourcePath, dependencyPath) {
		return this.#processImportedCSS(source, sourcePath, dependencyPath, this.fetch.bind(this));
	}

	#recordDependency(filePath, dependencyPath, { injectableSource, exportTokens }) {
		this.#store.record({
			file: filePath,
			dependencyPath,
			source: injectableSource,
			tokens: exportTokens,
		});
	}
}
