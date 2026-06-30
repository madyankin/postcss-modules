import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { processCSS } from "./processCSS.js";
import { loadConfig } from "./loadConfig.mjs";

let configPromise;
function getConfig() {
	if (!configPromise) configPromise = loadConfig();
	return configPromise;
}

export async function load(url, context, nextLoad) {
	if (!url.startsWith("file:") || !url.endsWith(".css")) {
		return nextLoad(url, context);
	}
	const filename = fileURLToPath(url);
	const source = await readFile(filename, "utf8");
	const opts = await getConfig();
	const tokens = await processCSS(source, filename, opts);
	return {
		format: "module",
		source: `export default ${JSON.stringify(tokens)};\n`,
		shortCircuit: true,
	};
}
