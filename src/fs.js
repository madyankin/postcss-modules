let fileSystem = {
	readFile: () => {
		throw Error("readFile not implemented");
	},

	writeFile: () => {
		throw Error("writeFile not implemented");
	},
};

export function setFileSystem(fs) {
	fileSystem.readFile = fs.readFile
	fileSystem.writeFile = fs.writeFile
}

export function getFileSystem() {
	return fileSystem;
}
