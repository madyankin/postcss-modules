import postcss            from 'postcss';
import Core               from 'css-modules-loader-core';
import Parser             from 'css-modules-loader-core/lib/parser';
import FileSystemLoader   from 'css-modules-loader-core/lib/file-system-loader';
import generateScopedName from './generateScopedName';


module.exports = postcss.plugin('postcss-modules', (opts = {}) => {
  Core.scope.generateScopedName = opts.generateScopedName || generateScopedName;

  const loader  = new FileSystemLoader('/', Core.defaultPlugins);
  const parser  = new Parser(loader.fetch.bind(loader));
  const plugins = [
    Core.values,
    Core.localByDefault,
    Core.extractImports,
    Core.scope,
    parser.plugin,
  ];

  return css => {
    const promise = new Promise(resolve => {
      postcss(plugins)
        .process(css, { from: css.source.input.file })
        .then(() => {
          Object.keys(loader.sources).forEach(key => {
            css.prepend(loader.sources[key]);
          });

          if (opts.getJSON) {
            opts.getJSON(css.source.input.file, parser.exportTokens);
          }

          resolve();
        });
    });

    return promise;
  };
});
