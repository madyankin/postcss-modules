import postcss            from 'postcss';
import Parser             from 'css-modules-loader-core/lib/parser';
import FileSystemLoader   from 'css-modules-loader-core/lib/file-system-loader';
import genericNames       from 'generic-names';
import generateScopedName from './generateScopedName';
import saveJSON           from './saveJSON';
import {
  getDefaultPlugins,
  isValidBehaviour,
  behaviours,
} from './behaviours';

const PLUGIN_NAME = 'postcss-modules';


function getDefaultScopeBehaviour(opts) {
  if (opts.scopeBehaviour && isValidBehaviour(opts.scopeBehaviour)) {
    return opts.scopeBehaviour;
  }

  return behaviours.LOCAL;
}


function getScopedNameGenerator(opts) {
  const scopedNameGenerator = opts.generateScopedName || generateScopedName;

  if (typeof scopedNameGenerator === 'function') return scopedNameGenerator;
  return genericNames(scopedNameGenerator, { context: process.cwd() });
}


function getLoader(opts, plugins) {
  return typeof opts.Loader === 'function'
    ? new opts.Loader('/', plugins)
    : new FileSystemLoader('/', plugins);
}


function getDefaultPluginsList(opts, inputFile) {
  const globalModulesWhitelist = opts.globalModulePaths || null;
  const defaultBehaviour       = getDefaultScopeBehaviour(opts);
  const generateName           = getScopedNameGenerator(opts);

  if (globalModulesWhitelist) {
    const isGlobalModule  = globalModulesWhitelist.some(regex => inputFile.match(regex));
    const moduleBehaviour = isGlobalModule ? behaviours.GLOBAL : behaviours.LOCAL;

    return getDefaultPlugins(moduleBehaviour, generateName);
  }

  return getDefaultPlugins(defaultBehaviour, generateName);
}


function isResultPlugin(plugin) {
  return plugin.postcssPlugin !== PLUGIN_NAME;
}


module.exports = postcss.plugin(PLUGIN_NAME, (opts = {}) => {
  const getJSON = opts.getJSON || saveJSON;

  return (css, result) => {
    const inputFile     = css.source.input.file;
    const resultPlugins = result.processor.plugins.filter(isResultPlugin);
    const pluginList    = getDefaultPluginsList(opts, inputFile);
    const plugins       = [...pluginList, ...resultPlugins];
    const loader        = getLoader(opts, plugins);
    const parser        = new Parser(loader.fetch.bind(loader));

    return new Promise((resolve, reject) => {
      postcss([...plugins, parser.plugin])
        .process(css, { from: inputFile })
        .then(() => {
          const out = loader.finalSource;
          if (out) css.prepend(out);

          getJSON(css.source.input.file, parser.exportTokens);

          resolve();
        }, reject);
    });
  };
});
