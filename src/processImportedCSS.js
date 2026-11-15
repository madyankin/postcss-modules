import postcss from "postcss";
import Parser from "./Parser";

export function createImportedCSSProcessor(plugins) {
	return async function processImportedCSS(source, sourcePath, dependencyPath, pathFetcher) {
		const parser = new Parser(pathFetcher, dependencyPath);
		const result = await postcss(plugins.concat([parser.plugin()])).process(source, {
			from: sourcePath,
		});

		return {
			injectableSource: result.css,
			exportTokens: parser.exportTokens,
		};
	};
}
