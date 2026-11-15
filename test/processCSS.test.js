import { processCSS } from "../src/processCSS";

it("processes CSS with the Node filesystem composition root", async () => {
	await expect(
		processCSS(".button {}", "/styles/button.css", {
			generateScopedName: (name) => `_${name}`,
		}),
	).resolves.toEqual({ button: "_button" });
});
