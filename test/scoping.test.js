import postcss from "postcss";
import { behaviours, getDefaultPluginsList } from "../src/scoping";

async function processWithScope(source, options = {}, from = "/input.css") {
	const plugins = getDefaultPluginsList(
		{ generateScopedName: (name) => `_${name}`, ...options },
		from,
	);
	return postcss(plugins).process(source, { from });
}

it.each([
	[behaviours.LOCAL, "._button {}"],
	[behaviours.GLOBAL, ".button {}"],
])("selects the %s scope pipeline", async (scopeBehaviour, expected) => {
	const result = await processWithScope(".button {}", { scopeBehaviour });

	expect(result.css).toContain(expected);
});

it("selects pure mode", async () => {
	await expect(
		processWithScope(":global(.button) {}", { scopeBehaviour: behaviours.PURE }),
	).rejects.toThrow(/is not pure/);
});

it("falls back to local mode for an unknown behaviour", async () => {
	const result = await processWithScope(".button {}", { scopeBehaviour: "unknown" });

	expect(result.css).toContain("._button {}");
});

it("lets a matching globalModulePaths entry override pure mode", async () => {
	const result = await processWithScope(
		":global(.button) {}",
		{ scopeBehaviour: behaviours.PURE, globalModulePaths: [/global/] },
		"/global.css",
	);

	expect(result.css).toBe(".button {}");
});

it("forwards exportGlobals to the scope plugin", async () => {
	const result = await processWithScope(":global(.button) {}", { exportGlobals: true });
	const exported = {};
	result.root.walkRules(":export", (rule) => {
		rule.walkDecls(({ prop, value }) => {
			exported[prop] = value;
		});
	});

	expect(exported).toEqual({ button: "button" });
});

it("supports string scoped-name generators and hash prefixes", async () => {
	const source = ".button {}";
	const withoutPrefix = await processWithScope(source, { generateScopedName: "[hash:base64:5]" });
	const withPrefix = await processWithScope(source, {
		generateScopedName: "[hash:base64:5]",
		hashPrefix: "prefix",
	});

	expect(withPrefix.css).not.toBe(withoutPrefix.css);
});
