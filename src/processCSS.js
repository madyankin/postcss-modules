import postcss from "postcss";
import { readFile, writeFile } from "fs";
import { makePlugin } from "./pluginFactory";

const fileSystem = { readFile, writeFile };

export async function processCSS(source, filename, opts = {}) {
	let tokens = {};
	const plugin = makePlugin(
		{
			...opts,
			getJSON: (_cssFile, json) => {
				tokens = json;
			},
		},
		{ fileSystem },
	);
	await postcss([plugin]).process(source, { from: filename });
	return tokens;
}
