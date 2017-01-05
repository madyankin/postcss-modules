import Core from 'css-modules-loader-core';

export const behaviours = {
  LOCAL:  'local',
  GLOBAL: 'global',
};


export function getDefaultPlugins(behaviour, generateScopedName) {
  const scope = Core.scope({ generateScopedName });

  const plugins = {
    [behaviours.LOCAL]: [
      Core.values,
      Core.localByDefault,
      Core.extractImports,
      scope,
    ],

    [behaviours.GLOBAL]: [
      Core.values,
      Core.extractImports,
      scope,
    ],
  };

  return plugins[behaviour];
}


export function isValidBehaviour(behaviour) {
  return Object.values(behaviours).includes(behaviour);
}
