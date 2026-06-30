import { existsSync } from "fs";
import { readFile } from "fs/promises";
import path from "path";
import { pathToFileURL } from "url";

const CONFIG_NAMES = [
	"postcss-modules.config.js",
	"postcss-modules.config.cjs",
	"postcss-modules.config.mjs",
];

async function importConfig(filePath) {
	const url = pathToFileURL(filePath).href;
	const mod = await import(url);
	return mod.default || mod;
}

export async function loadConfig(cwd = process.cwd()) {
	const explicit = process.env.POSTCSS_MODULES_CONFIG;
	if (explicit) {
		const resolved = path.isAbsolute(explicit) ? explicit : path.resolve(cwd, explicit);
		return importConfig(resolved);
	}

	for (const name of CONFIG_NAMES) {
		const candidate = path.resolve(cwd, name);
		if (existsSync(candidate)) {
			return importConfig(candidate);
		}
	}

	const pkgPath = path.resolve(cwd, "package.json");
	if (existsSync(pkgPath)) {
		try {
			const pkg = JSON.parse(await readFile(pkgPath, "utf8"));
			if (pkg["postcss-modules"]) return pkg["postcss-modules"];
		} catch {
			// ignore unreadable / malformed package.json
		}
	}

	return {};
}
