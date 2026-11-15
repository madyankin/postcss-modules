import FileSystemLoader from "./FileSystemLoader";

export function createLoader(opts, plugins, fileSystem) {
	const root = typeof opts.root === "undefined" ? "/" : opts.root;

	return typeof opts.Loader === "function"
		? new opts.Loader(root, plugins, opts.resolve)
		: new FileSystemLoader(root, plugins, opts.resolve, fileSystem);
}
