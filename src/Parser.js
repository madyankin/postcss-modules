// Initially copied from https://github.com/css-modules/css-modules-loader-core

const importRegexp = /^:import\((.+)\)$/;
import { replaceSymbols } from "icss-utils";

export default class Parser {
	constructor(pathFetcher, trace) {
		this.pathFetcher = pathFetcher;
		this.plugin = this.plugin.bind(this);
		this.exportTokens = {};
		this.translations = {};
		this.trace = trace;
	}

	plugin() {
		const parser = this;
		return {
			postcssPlugin: "css-modules-parser",
			async OnceExit(css) {
				await Promise.all(parser.fetchAllImports(css));
				parser.linkImportedSymbols(css);
				return parser.extractExports(css);
			},
		};
	}

	fetchAllImports(css) {
		let imports = [];
		css.each((node) => {
			if (node.type == "rule" && node.selector.match(importRegexp)) {
				imports.push(this.fetchImport(node, css.source.input.from, imports.length));
			}
		});
		return imports;
	}

	linkImportedSymbols(css) {
		replaceSymbols(css, this.translations);
	}

	extractExports(css) {
		css.each((node) => {
			if (node.type == "rule" && node.selector == ":export") this.handleExport(node);
		});
	}

	handleExport(exportNode) {
		exportNode.each((decl) => {
			if (decl.type == "decl") {
				Object.keys(this.translations).forEach((translation) => {
					decl.value = decl.value.replace(translation, this.translations[translation]);
				});
				this.exportTokens[decl.prop] = decl.value;
			}
		});
		exportNode.remove();
	}

	async fetchImport(importNode, relativeTo, depNr) {
		const file = importNode.selector.match(importRegexp)[1];
		const depTrace = this.trace + String.fromCharCode(depNr);

		const exports = await this.pathFetcher(file, relativeTo, depTrace);

		try {
			importNode.each((decl) => {
				if (decl.type == "decl") {
					this.translations[decl.prop] = exports[decl.value];
				}
			});
			importNode.remove();
		} catch (err) {
			console.log(err);
		}
	}
}
