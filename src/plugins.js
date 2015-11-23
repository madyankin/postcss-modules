import Core          from 'css-modules-loader-core';
import importModules from './importModules';
import applyImports  from './applyImports';

export default [
  // Core.values,
  Core.localByDefault,
  Core.extractImports,
  Core.scope,
  importModules,
  applyImports,
];
