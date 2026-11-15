import { readFile, writeFile } from "fs";
import { makePlugin } from "./pluginFactory";

const fileSystem = { readFile, writeFile };

module.exports = (opts = {}) => makePlugin(opts, { fileSystem });
module.exports.postcss = true;
