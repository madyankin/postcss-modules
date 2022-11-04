import extractImports from "postcss-modules-extract-imports";
import genericNames from "generic-names";
import localByDefault from "postcss-modules-local-by-default";
import modulesScope from "postcss-modules-scope";
import stringHash from "string-hash";
import values from "postcss-modules-values";

export const behaviours = {
	LOCAL: "local",
	GLOBAL: "global",
};

export function getDefaultPlugins({ behaviour, generateScopedName, exportGlobals }) {
	const scope = modulesScope({ generateScopedName, exportGlobals });

	const plugins = {
		[behaviours.LOCAL]: [values, localByDefault({ mode: "local" }), extractImports, scope],
		[behaviours.GLOBAL]: [values, localByDefault({ mode: "global" }), extractImports, scope],
	};

	return plugins[behaviour];
}

function isValidBehaviour(behaviour) {
	return (
		Object.keys(behaviours)
			.map((key) => behaviours[key])
			.indexOf(behaviour) > -1
	);
}

export function getDefaultScopeBehaviour(scopeBehaviour) {
	return scopeBehaviour && isValidBehaviour(scopeBehaviour) ? scopeBehaviour : behaviours.LOCAL;
}

function generateScopedNameDefault(name, filename, css) {
	const i = css.indexOf(`.${name}`);
	const lineNumber = css.substr(0, i).split(/[\r\n]/).length;
	const hash = stringHash(css).toString(36).substr(0, 5);

	return `_${name}_${hash}_${lineNumber}`;
}

export function getScopedNameGenerator(generateScopedName, hashPrefix) {
	const scopedNameGenerator = generateScopedName || generateScopedNameDefault;

	if (typeof scopedNameGenerator === "function") {
		return scopedNameGenerator;
	}

	return genericNames(scopedNameGenerator, {
		context: process.cwd(),
		hashPrefix: hashPrefix,
	});
}
