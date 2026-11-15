const PLUGIN_NAME = "postcss-modules";

export function addDependencyMessages(result, loader, inputFile) {
	for (const file of loader.dependencies || []) {
		result.messages.push({
			type: "dependency",
			plugin: PLUGIN_NAME,
			file,
			parent: result.opts.from || inputFile,
		});
	}
}

export function addExportMessage(result, exportTokens) {
	result.messages.push({
		type: "export",
		plugin: PLUGIN_NAME,
		exportTokens,
	});
}
