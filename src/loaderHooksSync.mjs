const runtimeUrl = new URL("./loaderRuntime.mjs", import.meta.url).href;

export function load(url, context, nextLoad) {
	if (!url.startsWith("file:") || !url.endsWith(".css")) {
		return nextLoad(url, context);
	}
	return {
		format: "module",
		source: `import { loadCSS } from ${JSON.stringify(runtimeUrl)};\nexport default await loadCSS(${JSON.stringify(url)});\n`,
		shortCircuit: true,
	};
}
