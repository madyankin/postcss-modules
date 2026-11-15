import postcss from "postcss";
import { prependDependencySources } from "../src/prependDependencySources";

it("prepends sources and preserves filenames on nested nodes", () => {
	const css = postcss.parse(".entry { color: black; }", { from: "/entry.css" });
	const loader = {
		finalSources: [
			{ file: "/one.css", source: ".one { color: red; }" },
			{ file: "/two.css", source: "@media screen { .two { color: blue; } }" },
		],
	};

	prependDependencySources(css, loader);

	const fileBySelector = {};
	css.walkRules((rule) => {
		fileBySelector[rule.selector] = rule.source.input.file;
	});
	expect(fileBySelector).toEqual({
		".one": "/one.css",
		".two": "/two.css",
		".entry": "/entry.css",
	});
	const media = css.first.next();
	expect(media.source.input.file).toBe("/two.css");
});

it("falls back to finalSource for legacy loaders", () => {
	const css = postcss.parse(".entry {}", { from: "/entry.css" });

	prependDependencySources(css, { finalSource: ".legacy {}" });

	expect(css.toString()).toBe(".legacy {}\n.entry {}");
});

it.each([{ finalSources: [] }, { finalSources: [{ file: "/empty.css", source: "" }] }])(
	"does nothing when structured dependency output is empty",
	(loader) => {
		const css = postcss.parse(".entry {}", { from: "/entry.css" });

		prependDependencySources(css, loader);

		expect(css.toString()).toBe(".entry {}");
	},
);

it("leaves prepended sources unattributed when node counts differ", () => {
	const css = postcss.parse(".entry {}", { from: "/entry.css" });
	const parse = jest.spyOn(postcss, "parse").mockReturnValue({ walk: () => {} });

	prependDependencySources(css, {
		finalSources: [{ file: "/dependency.css", source: ".dependency {}" }],
	});

	parse.mockRestore();
	expect(css.first.source).toBeUndefined();
});
