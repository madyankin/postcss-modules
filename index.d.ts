import type { Plugin } from "postcss";

declare type GenerateScopedNameFunction = (name: string, filename: string, css: string) => string;

declare type LocalsConventionFunction = (
	originalClassName: string,
	generatedClassName: string,
	inputFile: string
) => string;

declare class Loader {
	constructor(root: string, plugins: Plugin[]);

	fetch(file: string, relativeTo: string, depTrace: string): Promise<{ [key: string]: string }>;

	finalSource?: string | undefined;
}

declare interface Options {
	getJSON?(cssFilename: string, json: { [name: string]: string }, outputFilename?: string): void;

	localsConvention?:
		| "camelCase"
		| "camelCaseOnly"
		| "dashes"
		| "dashesOnly"
		| LocalsConventionFunction;

	scopeBehaviour?: "global" | "local";
	globalModulePaths?: RegExp[];

	generateScopedName?: string | GenerateScopedNameFunction;

	hashPrefix?: string;
	exportGlobals?: boolean;
	root?: string;

	Loader?: typeof Loader;

<<<<<<< HEAD
	resolve?: (file: string) => string | Promise<string>;

	fileResolve?: (
		file: string,
		importer: string
	) => string | null | Promise<string | null>;
=======
	resolve?: (file: string, importer: string) => string | null | Promise<string | null>;
>>>>>>> 7393c055accba46f9d122e9bee491c1ad1fafccb
}

declare interface PostcssModulesPlugin {
	(options: Options): Plugin;
	postcss: true;
}

declare const PostcssModulesPlugin: PostcssModulesPlugin;

export = PostcssModulesPlugin;
