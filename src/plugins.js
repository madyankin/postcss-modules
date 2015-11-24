import Core              from 'css-modules-loader-core';
import importModules     from './importModules';
import applyImports      from './applyImports';
import addGlobalComments from './addGlobalComments';

export default [
  // Core.values,
  addGlobalComments,
  Core.localByDefault,
  Core.extractImports,
  Core.scope,
  importModules,
  applyImports,
];
