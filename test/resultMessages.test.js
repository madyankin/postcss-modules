import { addDependencyMessages, addExportMessage } from "../src/resultMessages";

function makeResult(from) {
	return { messages: [], opts: { from } };
}

it("adds dependency messages in loader order", () => {
	const result = makeResult("/processed.css");

	addDependencyMessages(result, { dependencies: ["/nested.css", "/direct.css"] }, "/input.css");

	expect(result.messages).toEqual([
		{
			type: "dependency",
			plugin: "postcss-modules",
			file: "/nested.css",
			parent: "/processed.css",
		},
		{
			type: "dependency",
			plugin: "postcss-modules",
			file: "/direct.css",
			parent: "/processed.css",
		},
	]);
});

it("uses the input file as the dependency parent fallback", () => {
	const result = makeResult(undefined);

	addDependencyMessages(result, { dependencies: ["/dependency.css"] }, "/input.css");

	expect(result.messages[0].parent).toBe("/input.css");
});

it("accepts a loader without dependencies", () => {
	const result = makeResult("/input.css");

	addDependencyMessages(result, {}, "/input.css");

	expect(result.messages).toEqual([]);
});

it("adds an export message without copying the token map", () => {
	const result = makeResult("/input.css");
	const exportTokens = { button: "_button" };

	addExportMessage(result, exportTokens);

	expect(result.messages).toEqual([
		{
			type: "export",
			plugin: "postcss-modules",
			exportTokens,
		},
	]);
	expect(result.messages[0].exportTokens).toBe(exportTokens);
});
