import postcss from "postcss";
import unquote from "./unquote";
import Parser from "./Parser";
import createJSONWriter from "./saveJSON";
import { makeLocalsConventionReducer } from "./localsConvention";
import { createLoader } from "./createLoader";
import { prependDependencySources } from "./prependDependencySources";
import { addDependencyMessages, addExportMessage } from "./resultMessages";
import { getDefaultPluginsList } from "./scoping";

const PLUGIN_NAME = "postcss-modules";

function isOurPlugin(plugin) {
	return plugin.postcssPlugin === PLUGIN_NAME;
}

function removeEmptySelectors(css) {
	css.walkRules((rule) => {
		if (rule.selector.trim() === "") rule.remove();
	});
}

export function makePlugin(opts, { fileSystem } = {}) {
	return {
		postcssPlugin: PLUGIN_NAME,
		async OnceExit(css, { result }) {
			const getJSON = opts.getJSON || createJSONWriter(fileSystem.writeFile);
			const inputFile = css.source.input.file;
			const pluginList = getDefaultPluginsList(opts, inputFile);
			const resultPluginIndex = result.processor.plugins.findIndex((plugin) =>
				isOurPlugin(plugin),
			);
			if (resultPluginIndex === -1) {
				throw new Error("Plugin missing from options.");
			}

			const earlierPlugins = result.processor.plugins.slice(0, resultPluginIndex);
			const loaderPlugins = [...earlierPlugins, ...pluginList];
			const loader = createLoader(opts, loaderPlugins, fileSystem);

			const fetcher = async (file, relativeTo, dependencyPath) => {
				const unquoteFile = unquote(file);
				return loader.fetch.call(loader, unquoteFile, relativeTo, dependencyPath);
			};
			const parser = new Parser(fetcher);

			await postcss([...pluginList, parser.plugin()]).process(css, {
				from: inputFile,
			});

			// Remove rules whose selector was reduced to whitespace after
			// `:global { ... }` unwrapping — see #136.
			removeEmptySelectors(css);

			prependDependencySources(css, loader);
			addDependencyMessages(result, loader, inputFile);

			if (opts.localsConvention) {
				const reducer = makeLocalsConventionReducer(opts.localsConvention, inputFile);
				parser.exportTokens = Object.entries(parser.exportTokens).reduce(reducer, {});
			}

			addExportMessage(result, parser.exportTokens);

			// getJSON may return a promise
			return getJSON(css.source.input.file, parser.exportTokens, result.opts.to);
		},
	};
}
