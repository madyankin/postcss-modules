import js from "@eslint/js";
import jest from "eslint-plugin-jest";
import globals from "globals";

export default [
	js.configs.recommended,
	{
		languageOptions: {
			ecmaVersion: 2022,
			sourceType: "module",
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
