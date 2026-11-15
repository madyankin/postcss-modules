import path from "path";

export function normalizeRoot(root, platform = process.platform, cwd = process.cwd()) {
	if (root !== "/" || platform !== "win32") return root;

	const cwdDrive = cwd.slice(0, 3);
	if (!/^[A-Za-z]:\\$/.test(cwdDrive)) {
		throw new Error(`Failed to obtain root from "${cwd}".`);
	}
	return cwdDrive;
}

export async function resolveImport({
	request,
	relativeTo,
	root,
	fileResolve,
	resolveModule = require.resolve,
}) {
	const useFileResolve = typeof fileResolve === "function";
	const resolvedByUser = useFileResolve ? await fileResolve(request, relativeTo) : undefined;

	if (resolvedByUser && !path.isAbsolute(resolvedByUser)) {
		throw new Error('The returned path from the "fileResolve" option must be absolute.');
	}

	const relativeDir = path.dirname(relativeTo);
	const sourcePath = resolvedByUser || path.resolve(relativeDir, request);
	let filePath = resolvedByUser || path.resolve(path.resolve(root, relativeDir), request);

	if (!useFileResolve && request[0] !== "." && !path.isAbsolute(request)) {
		try {
			filePath = resolveModule(request);
		} catch {
			// Keep the path-based fallback when Node cannot resolve the request.
		}
	}

	return { filePath, sourcePath };
}
