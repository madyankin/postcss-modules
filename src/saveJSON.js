export default function createJSONWriter(writeFile) {
	return function saveJSON(cssFile, json) {
		return new Promise((resolve, reject) => {
			writeFile(`${cssFile}.json`, JSON.stringify(json), (error) =>
				error ? reject(error) : resolve(json),
			);
		});
	};
}
