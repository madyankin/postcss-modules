import js from "@eslint/js";
import babelParser from "@babel/eslint-parser";
import jest from "eslint-plugin-jest";
import globals from "globals";

export default [
	js.configs.recommended,
	{
		languageOptions: {
			parser: babelParser,
			sourceType: "module",
			parserOptions: {
				requireConfigFile: false,
			},
			globals: {
				...globals.node,
				...globals.es2021,
			},
		},
		plugins: { jest },
	},
	{
		files: ["test/**/*.js"],
		languageOptions: {
			globals: {
				...jest.environments.globals.globals,
			},
		},
	},
];
