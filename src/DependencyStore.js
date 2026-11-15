// Sorts dependencies in the following way:
// AAA comes before AA and A
// AB comes after AA and before A
// All Bs come after all As
// This ensures that the files are always returned in the following order:
// - In the order they were required, except
// - After all their dependencies
const dependencyPathSorter = (a, b) => {
	if (a.length < b.length) {
		return a < b.substring(0, a.length) ? -1 : 1;
	}

	if (a.length > b.length) {
		return a.substring(0, b.length) <= b ? -1 : 1;
	}

	return a < b ? -1 : 1;
};

export default class DependencyStore {
	constructor() {
		this.sources = {};
		this.dependencyPaths = {};
		this.tokensByFile = {};
	}

	getTokens(file) {
		return this.tokensByFile[file];
	}

	record({ file, dependencyPath, source, tokens }) {
		this.sources[file] = source;
		this.dependencyPaths[dependencyPath] = file;
		this.tokensByFile[file] = tokens;
	}

	get finalSources() {
		const written = new Set();

		return Object.keys(this.dependencyPaths)
			.sort(dependencyPathSorter)
			.map((key) => {
				const filename = this.dependencyPaths[key];
				if (written.has(filename)) return null;
				written.add(filename);

				return { file: filename, source: this.sources[filename] };
			})
			.filter(Boolean);
	}

	get dependencies() {
		return this.finalSources.map((entry) => entry.file);
	}

	get finalSource() {
		return this.finalSources.map((entry) => entry.source).join("");
	}
}
