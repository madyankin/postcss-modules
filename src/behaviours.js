import Core from 'css-modules-loader-core';

export const defaultPlugins = {
  local: [
    Core.values,
    Core.localByDefault,
    Core.extractImports,
    Core.scope,
  ],

  global: [
    Core.values,
    Core.extractImports,
    Core.scope,
  ],
};


export function isValidBehaviour(behaviour) {
  return behaviour === 'local' || behaviour === 'global';
}
