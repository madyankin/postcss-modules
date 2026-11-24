import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { processCSS } from "./processCSS.js";
import { loadConfig } from "./loadConfig.mjs";

let configPromise;
function getConfig() {
	if (!configPromise) configPromise = loadConfig();
	return configPromise;
}

export async function loadCSS(url) {
	const filename = fileURLToPath(url);
	const source = await readFile(filename, "utf8");
	const opts = await getConfig();
	return processCSS(source, filename, opts);
}
