import postcss from "postcss";
import { readFile, writeFile } from "fs";
import { setFileSystem } from "./fs";
import { makePlugin } from "./pluginFactory";

setFileSystem({ readFile, writeFile });

export async function processCSS(source, filename, opts = {}) {
	let tokens = {};
	const plugin = makePlugin({
		...opts,
		getJSON: (_cssFile, json) => {
			tokens = json;
		},
	});
	await postcss([plugin]).process(source, { from: filename });
	return tokens;
}
