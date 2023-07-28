import camelCase from "lodash.camelcase";

function dashesCamelCase(string) {
	return string.replace(/-+(\w)/g, (_, firstLetter) => firstLetter.toUpperCase());
}

export function makeLocalsConventionReducer(localsConvention, inputFile) {
	const isFunc = typeof localsConvention === "function";

	return (tokens, [className, value]) => {
		if (isFunc) {
			const convention = localsConvention(className, value, inputFile);

			if (Array.isArray(convention)) {

				convention.forEach(convention => tokens[convention] = value);

				return tokens;

			}

			tokens[convention] = value;

			return tokens;
		}

		switch (localsConvention) {
			case "none":
				tokens[className] = value;
				break;

			case "all":
				tokens[className] = value;
				tokens[camelCase(className)] = value;
				tokens[dashesCamelCase(className)] = value;
				break;

			case "camelCase":
				tokens[className] = value;
				tokens[camelCase(className)] = value;
				break;

			case "camelCaseOnly":
				tokens[camelCase(className)] = value;
				break;

			case "dashes":
				tokens[className] = value;
				tokens[dashesCamelCase(className)] = value;
				break;

			case "dashesOnly":
				tokens[dashesCamelCase(className)] = value;
				break;
		}

		return tokens;
	};
}
