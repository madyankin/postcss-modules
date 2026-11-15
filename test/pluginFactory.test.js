import postcss from "postcss";
import { makePlugin } from "../src/pluginFactory";

const noopPlugin = {
	postcssPlugin: "before-postcss-modules",
};

function processWithLoader(Loader, options = {}, processOptions = {}) {
	return postcss([
		noopPlugin,
		makePlugin({
			Loader,
			generateScopedName: (name) => `_${name}`,
			getJSON: () => {},
			...options,
		}),
	]).process(".local {}", { from: "/input.css", ...processOptions });
}

it("preserves the custom loader constructor contract", async () => {
	const resolve = () => "/resolved.css";
	let constructorArgs;

	class CustomLoader {
		constructor(...args) {
			constructorArgs = args;
		}

		async fetch() {
			return {};
		}
	}

	await processWithLoader(CustomLoader, { root: "/styles", resolve });

	expect(constructorArgs).toHaveLength(3);
	expect(constructorArgs[0]).toBe("/styles");
	expect(constructorArgs[1]).toEqual(expect.any(Array));
	expect(constructorArgs[1][0]).toBe(noopPlugin);
	expect(constructorArgs[2]).toBe(resolve);
});

it("prepends finalSource from a legacy custom loader", async () => {
	class LegacyLoader {
		async fetch() {
			return {};
		}

		get finalSource() {
			return ".dependency { color: red; }";
		}
	}

	const result = await processWithLoader(LegacyLoader);

	expect(result.css).toBe(".dependency { color: red; }\n._local {}");
	expect(result.messages.filter(({ type }) => type === "dependency")).toEqual([]);
});

it("preserves source filenames from finalSources", async () => {
	const dependencyFile = "/dependency.css";

	class SourceAwareLoader {
		async fetch() {
			return {};
		}

		get finalSources() {
			return [{ file: dependencyFile, source: ".dependency { color: red; }" }];
		}
	}

	const result = await processWithLoader(SourceAwareLoader);
	const declarationFiles = [];
	result.root.walkDecls((declaration) => declarationFiles.push(declaration.source.input.file));

	expect(declarationFiles).toEqual([dependencyFile]);
	expect(result.messages.filter(({ type }) => type === "dependency")).toEqual([]);
});

it("accepts a custom loader without optional output properties", async () => {
	class MinimalLoader {
		async fetch() {
			return {};
		}
	}

	await expect(processWithLoader(MinimalLoader)).resolves.toMatchObject({ css: "._local {}" });
});

it("awaits getJSON and passes its public arguments exactly once", async () => {
	let releaseGetJSON;
	let getJSONArgs;
	let processingSettled = false;
	const getJSON = (...args) => {
		getJSONArgs = args;
		return new Promise((resolve) => {
			releaseGetJSON = resolve;
		});
	};

	class MinimalLoader {
		async fetch() {
			return {};
		}
	}

	const processing = processWithLoader(MinimalLoader, { getJSON }, { to: "/output.css" }).then(
		(result) => {
			processingSettled = true;
			return result;
		},
	);

	await new Promise((resolve) => setImmediate(resolve));
	expect(getJSONArgs).toEqual(["/input.css", { local: "_local" }, "/output.css"]);
	expect(processingSettled).toBe(false);

	releaseGetJSON();
	await processing;
	expect(processingSettled).toBe(true);
});
