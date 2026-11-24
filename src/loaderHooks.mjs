import { loadCSS } from "./loaderRuntime.mjs";

export async function load(url, context, nextLoad) {
	if (!url.startsWith("file:") || !url.endsWith(".css")) {
		return nextLoad(url, context);
	}
	const tokens = await loadCSS(url);
	return {
		format: "module",
		source: `export default ${JSON.stringify(tokens)};\n`,
		shortCircuit: true,
	};
}
