import postcss                              from 'postcss';
import Core                                 from 'css-modules-loader-core';
import Parser                               from 'css-modules-loader-core/lib/parser';
import FileSystemLoader                     from 'css-modules-loader-core/lib/file-system-loader';
import genericNames                         from 'generic-names';
import generateScopedName                   from './generateScopedName';
import saveJSON                             from './saveJSON';
import { defaultPlugins, isValidBehaviour } from './behaviours';


module.exports = postcss.plugin('postcss-modules', (opts = {}) => {
  const scopedNameGenerator = opts.generateScopedName || generateScopedName;
  const getJSON             = opts.getJSON || saveJSON;

  const globalModulePathWhitelist = opts.globalModulePaths || null;

  let defaultScopeBehaviour = 'local';

  if (opts.scopeBehaviour && isValidBehaviour(opts.scopeBehaviour)) {
    defaultScopeBehaviour = opts.scopeBehaviour;
  }

  if (typeof scopedNameGenerator === 'function') {
    Core.scope.generateScopedName = scopedNameGenerator;
  } else {
    Core.scope.generateScopedName = genericNames(scopedNameGenerator, {
      context: process.cwd(),
    });
  }

  return (css, result) => {
    const inputFile = css.source.input.file;

    const resultPlugins = result.processor.plugins
      .filter(plugin => plugin.postcssPlugin !== 'postcss-modules');

    let pluginList = defaultPlugins[defaultScopeBehaviour];

    if (globalModulePathWhitelist) {
      const isGlobalModule = globalModulePathWhitelist
        .filter(regex => inputFile.match(regex))
        .length !== 0;
      pluginList = defaultPlugins[isGlobalModule ? 'global' : 'local'];
    }

    const plugins = [...pluginList, ...resultPlugins];

    const loader = typeof opts.Loader === 'function' ?
      new opts.Loader('/', plugins) :
      new FileSystemLoader('/', plugins);

    const parser = new Parser(loader.fetch.bind(loader));

    const promise = new Promise((resolve, reject) => {
      postcss([...plugins, parser.plugin])
        .process(css, { from: inputFile })
        .then(() => {
          const out = loader.finalSource;
          if (out) {
            css.prepend(out);
          }

          getJSON(css.source.input.file, parser.exportTokens);

          resolve();
        }, reject);
    });

    return promise;
  };
});
