// Copied from https://github.com/css-modules/css-modules-loader-core
import replaceSymbols from "icss-replace-symbols";
import postcss from 'postcss';

const importRegexp = /^:import\((.+)\)$/;

export default class Parser {
  constructor(root, plugins, loader, trace, ctx = {}) {
    this.root = root;
    this.plugins = plugins;
    this.loader = loader;
    this.plugin = this.plugin.bind(this);
    this.exportTokens = {};
    this.translations = {};
    this.trace = trace || '';

    this.sources = ctx.sources || {};
    this.traces = ctx.traces || {};
    this.tokensByFile = ctx.tokensByFile || {};
  }

  plugin() {
    const parser = this;
    return {
      postcssPlugin: "css-modules-parser",
      OnceExit(css) {
        return Promise.all(parser.fetchAllImports(css))
          .then(() => parser.linkImportedSymbols(css))
          .then(() => parser.extractExports(css));
      },
    };
  }

  fetchAllImports(css) {
    let imports = [];
    let trace = 0;
    css.each((node) => {
      if (node.type == "rule" && node.selector.match(importRegexp)) {
        imports.push(
          this.fetchImport(node, css.source.input.from, trace++)
        );
      }
    });
    return imports;
  }

  linkImportedSymbols(css) {
    replaceSymbols(css, this.translations);
  }

  extractExports(css) {
    css.each((node) => {
      if (node.type == "rule" && node.selector == ":export")
        this.handleExport(node);
    });
  }

  handleExport(exportNode) {
    exportNode.each((decl) => {
      if (decl.type == "decl") {
        Object.keys(this.translations).forEach((translation) => {
          decl.value = decl.value.replace(
            translation,
            this.translations[translation]
          );
        });
        this.exportTokens[decl.prop] = decl.value;
      }
    });
    exportNode.remove();
  }

  async fetchImport(importNode, relativeTo, depNr) {
    const file = importNode.selector.match(importRegexp)[1].replace(/^["']|["']$/g, ""),
      depTrace = this.trace + String.fromCharCode(65 + depNr), // 65 = A, making the trace more readable
      id = this.loader.resolveId(file, relativeTo, this.root),
      subParser = new Parser(this.root, this.plugins, this.loader, depTrace, {
        sources: this.sources,
        traces: this.traces,
        tokensByFile: this.tokensByFile
      });
    let tokens = this.tokensByFile[id];

    try {
      if (!tokens) {
        const content = await this.loader.resolve(id);
        const { css } = await postcss(this.plugins.concat([subParser.plugin()]))
          .process(content, { from: id });
        tokens = subParser.exportTokens;

        this.sources[id] = css;
        this.traces[depTrace] = id;
        this.tokensByFile[id] = tokens;
      }

      importNode.each((decl) => {
        if (decl.type == "decl") {
          this.translations[decl.prop] = tokens[decl.value];
        }
      });
      importNode.remove();
    } catch (e) {
      console.error(e);
    }
  }


  get finalSource() {
    const traces = this.traces;
    const sources = this.sources;
    let written = new Set();

    return Object.keys(traces)
      .sort(traceKeySorter)
      .map((key) => {
        const filename = traces[key];
        if (written.has(filename)) {
          return null;
        }
        written.add(filename);

        return sources[filename];
      })
      .join("");
  }
}

// Sorts dependencies in the following way:
// AAA comes before AA and A
// AB comes after AA and before A
// All Bs come after all As
// This ensures that the files are always returned in the following order:
// - In the order they were required, except
// - After all their dependencies
const traceKeySorter = (a, b) => {
  if (a.length < b.length) {
    return a < b.substring(0, a.length) ? -1 : 1;
  } else if (a.length > b.length) {
    return a.substring(0, b.length) <= b ? -1 : 1;
  } else {
    return a < b ? -1 : 1;
  }
};
