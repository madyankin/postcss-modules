import postcss from "postcss";
import camelCase from "lodash.camelcase";
import genericNames from "generic-names";
import unquote from "./unquote";

import Parser from "./css-loader-core/parser";
import FileSystemLoader from "./css-loader-core/loader";

import generateScopedName from "./generateScopedName";
import saveJSON from "./saveJSON";
import { getDefaultPlugins, isValidBehaviour, behaviours } from "./behaviours";

const PLUGIN_NAME = "postcss-modules";

function getDefaultScopeBehaviour(opts) {
	if (opts.scopeBehaviour && isValidBehaviour(opts.scopeBehaviour)) {
		return opts.scopeBehaviour;
	}

	return behaviours.LOCAL;
}

function getScopedNameGenerator(opts) {
	const scopedNameGenerator = opts.generateScopedName || generateScopedName;

	if (typeof scopedNameGenerator === "function") return scopedNameGenerator;
	return genericNames(scopedNameGenerator, {
		context: process.cwd(),
		hashPrefix: opts.hashPrefix,
	});
}

function getLoader(opts, plugins) {
	const root = typeof opts.root === "undefined" ? "/" : opts.root;
	return typeof opts.Loader === "function"
<<<<<<< HEAD
		? new opts.Loader(root, plugins, opts.fileResolve)
		: new FileSystemLoader(root, plugins, opts.fileResolve);
=======
		? new opts.Loader(root, plugins, opts.resolve)
		: new FileSystemLoader(root, plugins, opts.resolve);
>>>>>>> 7393c055accba46f9d122e9bee491c1ad1fafccb
}

function isGlobalModule(globalModules, inputFile) {
	return globalModules.some((regex) => inputFile.match(regex));
}

function getDefaultPluginsList(opts, inputFile) {
	const globalModulesList = opts.globalModulePaths || null;
	const exportGlobals = opts.exportGlobals || false;
	const defaultBehaviour = getDefaultScopeBehaviour(opts);
	const generateScopedName = getScopedNameGenerator(opts);

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

function isOurPlugin(plugin) {
	return plugin.postcssPlugin === PLUGIN_NAME;
}

function dashesCamelCase(string) {
	return string.replace(/-+(\w)/g, (_, firstLetter) => firstLetter.toUpperCase());
}

module.exports = (opts = {}) => {
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
<<<<<<< HEAD
			// resolve and fileResolve can't be used together
			if (
				typeof opts.resolve === "function" &&
				typeof opts.fileResolve == "function"
			) {
				throw new Error(
					'Please use either the "resolve" or the "fileResolve" option.'
				);
			}
			const earlierPlugins = result.processor.plugins.slice(
				0,
				resultPluginIndex
			);
=======

			const earlierPlugins = result.processor.plugins.slice(0, resultPluginIndex);
>>>>>>> 7393c055accba46f9d122e9bee491c1ad1fafccb
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
				const isFunc = typeof opts.localsConvention === "function";

				parser.exportTokens = Object.entries(parser.exportTokens).reduce(
					(tokens, [className, value]) => {
						if (isFunc) {
							const convention = opts.localsConvention(className, value, inputFile);
							tokens[convention] = value;

							return tokens;
						}

						switch (opts.localsConvention) {
							case "camelCase":
								tokens[className] = value;
								tokens[camelCase(className)] = value;
								break;

							case "camelCaseOnly":
								tokens[camelCase(className)] = value;
								break;

							case "dashes":
								tokens[className] = value;
								tokens[dashesCamelCase(className)] = value;
								break;

							case "dashesOnly":
								tokens[dashesCamelCase(className)] = value;
								break;
						}

						return tokens;
					},
					{}
				);
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
};

module.exports.postcss = true;
