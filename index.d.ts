import type { Plugin } from "postcss";

declare type GenerateScopedNameFunction = (name: string, filename: string, css: string) => string;

declare type ResolveFunction = (
	file: string,
	importer: string,
) => string | null | Promise<string | null>;

declare type LocalsConventionFunction = (
	originalClassName: string,
	generatedClassName: string,
	inputFile: string,
) => string | string[];

declare class Loader {
	constructor(root: string, plugins: Plugin[], resolve?: ResolveFunction);

	fetch(
		file: string,
		relativeTo: string,
		dependencyPath: string,
	): Promise<{ [key: string]: string }>;

	finalSource?: string | undefined;
	finalSources?: { file: string; source: string }[] | undefined;
	dependencies?: string[] | undefined;
}

declare interface Options {
	getJSON?(cssFilename: string, json: { [name: string]: string }, outputFilename?: string): void;

	localsConvention?:
		| "camelCase"
		| "camelCaseOnly"
		| "dashes"
		| "dashesOnly"
		| "all"
		| "none"
		| LocalsConventionFunction;

	scopeBehaviour?: "global" | "local" | "pure";
	globalModulePaths?: RegExp[];

	generateScopedName?: string | GenerateScopedNameFunction;

	hashPrefix?: string;
	exportGlobals?: boolean;
	root?: string;

	Loader?: typeof Loader;

	resolve?: ResolveFunction;
}

declare interface PostcssModulesPlugin {
	(options: Options): Plugin;
	postcss: true;
}

declare const PostcssModulesPlugin: PostcssModulesPlugin;

export = PostcssModulesPlugin;
