import postcss from "postcss";

function countNodes(nodes) {
	let count = 0;
	for (const node of nodes) {
		count += 1;
		if (typeof node.walk === "function") {
			node.walk(() => {
				count += 1;
			});
		}
	}
	return count;
}

function collectSourceSequence(sources) {
	const sequence = [];
	for (const { file, source } of sources) {
		postcss.parse(source, { from: file }).walk((node) => {
			sequence.push(node.source);
		});
	}
	return sequence;
}

function assignSourceSequence(nodes, sources) {
	let index = 0;
	for (const node of nodes) {
		node.source = sources[index++];
		if (typeof node.walk === "function") {
			node.walk((child) => {
				child.source = sources[index++];
			});
		}
	}
}

export function prependDependencySources(css, loader) {
	const sources = Array.isArray(loader.finalSources) ? loader.finalSources : null;
	if (!sources) {
		if (loader.finalSource) css.prepend(loader.finalSource);
		return;
	}

	const joined = sources.map((entry) => entry.source).join("");
	if (!joined) return;

	const countBefore = css.nodes.length;
	css.prepend(joined);
	const prepended = css.nodes.slice(0, css.nodes.length - countBefore);
	const sourceSequence = collectSourceSequence(sources);

	if (countNodes(prepended) === sourceSequence.length) {
		assignSourceSequence(prepended, sourceSequence);
	}
}
