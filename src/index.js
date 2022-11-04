import { readFile, writeFile } from "fs";
import { setFileSystem } from "./fs";
import { makePlugin } from "./pluginFactory";

setFileSystem({ readFile, writeFile });

module.exports = (opts = {}) => makePlugin(opts);
module.exports.postcss = true;
