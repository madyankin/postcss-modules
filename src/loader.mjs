import * as nodeModule from "node:module";
import { load } from "./loaderHooksSync.mjs";

if (typeof nodeModule.registerHooks === "function") {
	nodeModule.registerHooks({ load });
} else {
	nodeModule.register("./loaderHooks.mjs", import.meta.url);
}
