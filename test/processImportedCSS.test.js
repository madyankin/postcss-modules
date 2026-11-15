import { createImportedCSSProcessor } from "../src/processImportedCSS";

it("returns transformed CSS and extracted tokens together", async () => {
	const processImportedCSS = createImportedCSSProcessor([]);

	await expect(
		processImportedCSS(':export { button: "_button"; }', "/dependency.css", "A", jest.fn()),
	).resolves.toEqual({
		injectableSource: "",
		exportTokens: { button: '"_button"' },
	});
});

it("passes imports to the recursive path fetcher with a child dependency path", async () => {
	const pathFetcher = jest.fn(async () => ({ dependency: "_dependency" }));
	const processImportedCSS = createImportedCSSProcessor([]);

	const result = await processImportedCSS(
		':import("./dependency.css") { imported: dependency; }\n:export { local: imported; }',
		"/entry.css",
		"A",
		pathFetcher,
	);

	expect(pathFetcher).toHaveBeenCalledWith('"./dependency.css"', "/entry.css", "A\0");
	expect(result).toEqual({ injectableSource: "", exportTokens: { local: "_dependency" } });
});
