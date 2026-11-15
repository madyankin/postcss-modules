import FileSystemLoader from "../src/FileSystemLoader";
import { createLoader } from "../src/createLoader";

const plugins = [{ postcssPlugin: "test" }];
const fileSystem = { readFile: jest.fn(), writeFile: jest.fn() };

it("creates the built-in loader with the resolver and internal filesystem", async () => {
	const resolve = jest.fn(async () => "/resolved.css");
	const readFile = jest.fn((_file, _encoding, callback) => callback(null, ".dependency {}"));
	const loader = createLoader({ resolve }, plugins, { readFile });

	expect(loader).toBeInstanceOf(FileSystemLoader);
	await expect(loader.fetch("dependency", "/input.css")).resolves.toEqual({});
	expect(resolve).toHaveBeenCalledWith("dependency", "/input.css");
	expect(readFile).toHaveBeenCalledWith("/resolved.css", "utf-8", expect.any(Function));
});

it("preserves the public custom loader constructor contract", () => {
	const resolve = jest.fn();
	let constructorArgs;
	class CustomLoader {
		constructor(...args) {
			constructorArgs = args;
		}
	}

	const loader = createLoader(
		{ Loader: CustomLoader, root: "/styles", resolve },
		plugins,
		fileSystem,
	);

	expect(loader).toBeInstanceOf(CustomLoader);
	expect(constructorArgs).toEqual(["/styles", plugins, resolve]);
});

it("uses the default root for a custom loader without exposing internal dependencies", () => {
	let constructorArgs;
	class CustomLoader {
		constructor(...args) {
			constructorArgs = args;
		}
	}

	createLoader({ Loader: CustomLoader }, plugins, fileSystem);

	expect(constructorArgs).toEqual(["/", plugins, undefined]);
});
