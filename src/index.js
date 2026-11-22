import { readFile, realpath, writeFile } from "fs";
import { makePlugin } from "./pluginFactory";

const fileSystem = { readFile, realpath, writeFile };

module.exports = (opts = {}) => makePlugin(opts, { fileSystem });
module.exports.postcss = true;
