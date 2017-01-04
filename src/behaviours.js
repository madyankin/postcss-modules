import Core from 'css-modules-loader-core';

export const behaviours = {
  LOCAL:  'local',
  GLOBAL: 'global',
};


export const defaultPlugins = {
  [behaviours.LOCAL]: [
    Core.values,
    Core.localByDefault,
    Core.extractImports,
    Core.scope,
  ],

  [behaviours.GLOBAL]: [
    Core.values,
    Core.extractImports,
    Core.scope,
  ],
};


export function isValidBehaviour(behaviour) {
  return Object.values(behaviours).includes(behaviour);
}
