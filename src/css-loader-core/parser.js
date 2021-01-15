// Copied from https://github.com/css-modules/css-modules-loader-core

const importRegexp = /^:import\((.+)\)$/;
import replaceSymbols from "icss-replace-symbols";
import postcss from 'postcss';
import path from "path";

export default class Parser {
  constructor(root, plugins, pathFetcher, trace, ctx = {}) {
    this.root = root;
    this.plugins = plugins;
    this.pathFetcher = pathFetcher;
    this.plugin = this.plugin.bind(this);
    this.exportTokens = {};
    this.translations = {};
    this.trace = trace;

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
    css.each((node) => {
      if (node.type == "rule" && node.selector.match(importRegexp)) {
        imports.push(
          this.fetchImport(node, css.source.input.from, imports.length)
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

  fetchImport(importNode, relativeTo, depNr) {
    let file = importNode.selector.match(importRegexp)[1],
      depTrace = this.trace + String.fromCharCode(depNr);
    let newPath = file.replace(/^["']|["']$/g, "");
    let relativeDir = path.dirname(relativeTo),
      rootRelativePath = path.resolve(relativeDir, newPath),
      fileRelativePath = path.resolve(
        path.join(this.root, relativeDir),
        newPath
      );
    let subParser = new Parser(this.root, this.plugins, this.pathFetcher, depTrace, {
      sources: this.sources,
      traces: this.traces,
      tokensByFile: this.tokensByFile
    })
    const tokens = this.tokensByFile[fileRelativePath]

    const base = tokens
      ? Promise.resolve(tokens)
      : this.pathFetcher(newPath, relativeTo, this.root)
      .then(content => {
        return postcss(this.plugins.concat([subParser.plugin()]))
          .process(content, { from: "/" + rootRelativePath })
          .then((result) => {
            return {
              injectableSource: result.css,
              exportTokens: subParser.exportTokens,
            };
          })
          .then(({ injectableSource, exportTokens }) => {
            this.sources[fileRelativePath] = injectableSource;
            this.traces[depTrace] = fileRelativePath;
            this.tokensByFile[fileRelativePath] = exportTokens;
            return exportTokens;
          });
      })
    return base
      .then(
        (exports) => {
          importNode.each((decl) => {
            if (decl.type == "decl") {
              this.translations[decl.prop] = exports[decl.value];
            }
          });
          importNode.remove();
        },
        (err) => console.log(err)
      );
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
