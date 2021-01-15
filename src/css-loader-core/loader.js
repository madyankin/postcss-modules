import fs from "fs";
import path from "path";

export default (newPath, relativeTo, root) => {
  return new Promise((resolve, reject) => {
    let relativeDir = path.dirname(relativeTo),
      absolutePath = path.resolve(
        path.join(root, relativeDir),
        newPath
      );

    // if the path is not relative or absolute, try to resolve it in node_modules
    if (newPath[0] !== "." && newPath[0] !== "/") {
      try {
        absolutePath = require.resolve(newPath);
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
