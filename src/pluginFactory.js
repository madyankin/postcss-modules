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
				isOurPlugin(plugin),
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

			// Remove rules whose selector was reduced to whitespace after
			// `:global { ... }` unwrapping — see #136.
			css.walkRules((rule) => {
				if (rule.selector.trim() === "") rule.remove();
			});

			// Prepend the traced dependencies exactly as before, then re-parse
			// each dependency with its own `from` and graft those sources onto
			// the prepended nodes, pairing them by position. The pairing holds
			// because each dependency is complete CSS, so parsing the
			// concatenation yields the same node sequence as parsing each part.
			// If malformed CSS merges nodes across a file boundary the counts
			// differ and the graft is skipped, leaving the nodes unattributed
			// as before. Plugins that run after this one (e.g. url rewriters)
			// need `source.input.file` to resolve relative paths against the
			// file the CSS actually came from — see #149.
			const sources = Array.isArray(loader.finalSources) ? loader.finalSources : null;
			if (sources) {
				const joined = sources.map((entry) => entry.source).join("");
				if (joined) {
					const countBefore = css.nodes.length;
					css.prepend(joined);
					const prepended = css.nodes.slice(0, css.nodes.length - countBefore);
					const sourceSeq = [];
					for (const { file, source } of sources) {
						postcss.parse(source, { from: file }).walk((node) => {
							sourceSeq.push(node.source);
						});
					}
					let count = 0;
					for (const node of prepended) {
						count += 1;
						if (typeof node.walk === "function") {
							node.walk(() => {
								count += 1;
							});
						}
					}
					if (count === sourceSeq.length) {
						let i = 0;
						for (const node of prepended) {
							node.source = sourceSeq[i++];
							if (typeof node.walk === "function") {
								node.walk((child) => {
									child.source = sourceSeq[i++];
								});
							}
						}
					}
				}
			} else {
				// Custom loaders may not implement `finalSources`.
				const out = loader.finalSource;
				if (out) css.prepend(out);
			}

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
