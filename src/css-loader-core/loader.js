import fs from "fs";
import path from "path";

export default (imported, importee, projectRoot) => {
  return new Promise((resolve, reject) => {
    let importeeDir = path.dirname(importee),
      absolutePath = path.resolve(
        path.join(projectRoot, importeeDir),
        imported
      );

    // if the path is not relative or absolute, try to resolve it in node_modules
    if (imported[0] !== "." && imported[0] !== "/") {
      try {
        absolutePath = require.resolve(imported);
      } catch (e) {
        // noop
      }
    }

    fs.readFile(absolutePath, "utf-8", (err, source) => {
      if (err) reject(err);
      else resolve(source);
    });
  });
}
