import DependencyStore from "../src/DependencyStore";

function record(store, file, dependencyPath, source = `/* ${file} */`, tokens = {}) {
	store.record({ file, dependencyPath, source, tokens });
}

it("stores and returns token maps by filename", () => {
	const store = new DependencyStore();
	const tokens = { button: "_button" };

	record(store, "/button.css", "A", ".button {}", tokens);

	expect(store.getTokens("/button.css")).toBe(tokens);
	expect(store.getTokens("/missing.css")).toBeUndefined();
});

it("orders nested dependencies before their importer and siblings in request order", () => {
	const store = new DependencyStore();
	record(store, "/importer.css", "A");
	record(store, "/second.css", "B");
	record(store, "/nested-second.css", "AB");
	record(store, "/nested-first.css", "AA");

	expect(store.dependencies).toEqual([
		"/nested-first.css",
		"/nested-second.css",
		"/importer.css",
		"/second.css",
	]);
});

it("suppresses duplicate files in ordered source output", () => {
	const store = new DependencyStore();
	record(store, "/dependency.css", "A", ".dependency {}");
	record(store, "/dependency.css", "B", ".dependency {}");

	expect(store.finalSources).toEqual([{ file: "/dependency.css", source: ".dependency {}" }]);
	expect(store.dependencies).toEqual(["/dependency.css"]);
});

it("projects the same ordered sources as a concatenated string", () => {
	const store = new DependencyStore();
	record(store, "/importer.css", "A", ".importer {}");
	record(store, "/nested.css", "AA", ".nested {}");

	expect(store.finalSource).toBe(".nested {}.importer {}");
	expect(store.finalSource).toBe(store.finalSources.map(({ source }) => source).join(""));
});
