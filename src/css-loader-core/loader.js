import fs from "fs";
import path from "path";

export function resolveRelativeImport(importee, importer, projectRoot) {
  const importerDir = path.dirname(importer);
  let pathFromProjectRoot = path.resolve(projectRoot, importerDir, importee);

  // if the path is not relative or absolute, try to resolve it in node_modules
  if (importee[0] !== "." && importee[0] !== "/") {
    try {
      pathFromProjectRoot = require.resolve(importee);
    } catch (e) {
      // noop
    }
  }

  return pathFromProjectRoot;
}

export default {
  resolveId: (importee, importer, projectRoot) => {
    return resolveRelativeImport(importee, importer, projectRoot)
  },
  resolve: (importee) => {
    return new Promise((resolve, reject) => {
      fs.readFile(importee, "utf-8", (err, source) => {
        if (err) reject(err);
        else resolve(source);
      });
    });
  }
}
