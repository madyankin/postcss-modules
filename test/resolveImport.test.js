import path from "path";
import { normalizeRoot, resolveImport } from "../src/resolveImport";

it("normalizes the default root to the current Windows drive", () => {
	expect(normalizeRoot("/", "win32", "C:\\project\\styles")).toBe("C:\\");
	expect(() => normalizeRoot("/", "win32", "project\\styles")).toThrow(
		'Failed to obtain root from "project\\styles".',
	);
});

it("leaves explicit and non-Windows roots unchanged", () => {
	expect(normalizeRoot("/styles", "win32", "C:\\project")).toBe("/styles");
	expect(normalizeRoot("/", "darwin", "/project")).toBe("/");
});

it("resolves a relative request from its importer", async () => {
	await expect(
		resolveImport({
			request: "./dependency.css",
			relativeTo: "/project/entry.css",
			root: "/",
		}),
	).resolves.toEqual({
		filePath: "/project/dependency.css",
		sourcePath: "/project/dependency.css",
	});
});

it("keeps an absolute request as both paths", async () => {
	await expect(
		resolveImport({
			request: "/shared/dependency.css",
			relativeTo: "/project/entry.css",
			root: "/",
		}),
	).resolves.toEqual({
		filePath: "/shared/dependency.css",
		sourcePath: "/shared/dependency.css",
	});
});

it("uses the absolute result from a custom resolver", async () => {
	const fileResolve = jest.fn(async () => "/resolved/dependency.css");

	await expect(
		resolveImport({
			request: "alias",
			relativeTo: "/project/entry.css",
			root: "/ignored",
			fileResolve,
		}),
	).resolves.toEqual({
		filePath: "/resolved/dependency.css",
		sourcePath: "/resolved/dependency.css",
	});
	expect(fileResolve).toHaveBeenCalledWith("alias", "/project/entry.css");
});

it("rejects a relative custom resolver result", async () => {
	await expect(
		resolveImport({
			request: "alias",
			relativeTo: "/project/entry.css",
			root: "/",
			fileResolve: async () => "relative.css",
		}),
	).rejects.toThrow('The returned path from the "fileResolve" option must be absolute.');
});

it("uses Node resolution for a bare specifier", async () => {
	const resolveModule = jest.fn(() => "/node_modules/package/styles.css");

	await expect(
		resolveImport({
			request: "package/styles.css",
			relativeTo: "/project/entry.css",
			root: "/",
			resolveModule,
		}),
	).resolves.toEqual({
		filePath: "/node_modules/package/styles.css",
		sourcePath: path.resolve("/project", "package/styles.css"),
	});
	expect(resolveModule).toHaveBeenCalledWith("package/styles.css");
});

it("keeps the path fallback when Node cannot resolve a bare specifier", async () => {
	const resolveModule = () => {
		throw new Error("missing");
	};

	await expect(
		resolveImport({
			request: "missing/styles.css",
			relativeTo: "/project/entry.css",
			root: "/",
			resolveModule,
		}),
	).resolves.toEqual({
		filePath: "/project/missing/styles.css",
		sourcePath: "/project/missing/styles.css",
	});
});
