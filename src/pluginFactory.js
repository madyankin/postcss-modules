import postcss from "postcss";
import unquote from "./unquote";
import Parser from "./Parser";
import saveJSON from "./saveJSON";
import { makeLocalsConventionReducer } from "./localsConvention";
import FileSystemLoader from "./FileSystemLoader";
import {
	getDefaultPlugins,
	getDefaultScopeBehaviour,
	behaviours,
	getScopedNameGenerator,
} from "./scoping";

const PLUGIN_NAME = "postcss-modules";

function isGlobalModule(globalModules, inputFile) {
	return globalModules.some((regex) => inputFile.match(regex));
}

function getDefaultPluginsList(opts, inputFile) {
	const globalModulesList = opts.globalModulePaths || null;
	const exportGlobals = opts.exportGlobals || false;
	const defaultBehaviour = getDefaultScopeBehaviour(opts.scopeBehaviour);
	const generateScopedName = getScopedNameGenerator(opts.generateScopedName, opts.hashPrefix);

	if (globalModulesList && isGlobalModule(globalModulesList, inputFile)) {
		return getDefaultPlugins({
			behaviour: behaviours.GLOBAL,
			generateScopedName,
			exportGlobals,
		});
	}

	return getDefaultPlugins({
		behaviour: defaultBehaviour,
		generateScopedName,
		exportGlobals,
	});
}

function getLoader(opts, plugins) {
	const root = typeof opts.root === "undefined" ? "/" : opts.root;

	return typeof opts.Loader === "function"
		? new opts.Loader(root, plugins, opts.resolve)
		: new FileSystemLoader(root, plugins, opts.resolve);
}

function isOurPlugin(plugin) {
	return plugin.postcssPlugin === PLUGIN_NAME;
}

export function makePlugin(opts) {
	return {
		postcssPlugin: PLUGIN_NAME,
		async OnceExit(css, { result }) {
			const getJSON = opts.getJSON || saveJSON;
			const inputFile = css.source.input.file;
			const pluginList = getDefaultPluginsList(opts, inputFile);
			const resultPluginIndex = result.processor.plugins.findIndex((plugin) =>
				isOurPlugin(plugin)
			);
			if (resultPluginIndex === -1) {
				throw new Error("Plugin missing from options.");
			}

			const earlierPlugins = result.processor.plugins.slice(0, resultPluginIndex);
			const loaderPlugins = [...earlierPlugins, ...pluginList];
			const loader = getLoader(opts, loaderPlugins);

			const fetcher = async (file, relativeTo, depTrace) => {
				const unquoteFile = unquote(file);
				return loader.fetch.call(loader, unquoteFile, relativeTo, depTrace);
			};
			const parser = new Parser(fetcher);

			await postcss([...pluginList, parser.plugin()]).process(css, {
				from: inputFile,
			});

			const out = loader.finalSource;
			if (out) css.prepend(out);

			if (opts.localsConvention) {
				const reducer = makeLocalsConventionReducer(opts.localsConvention, inputFile);
				parser.exportTokens = Object.entries(parser.exportTokens).reduce(reducer, {});
			}

			result.messages.push({
				type: "export",
				plugin: "postcss-modules",
				exportTokens: parser.exportTokens,
			});

			// getJSON may return a promise
			return getJSON(css.source.input.file, parser.exportTokens, result.opts.to);
		},
	};
}
