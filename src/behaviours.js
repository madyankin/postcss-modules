import localByDefault from "postcss-modules-local-by-default";
import extractImports from "postcss-modules-extract-imports";
import modulesScope from "postcss-modules-scope";
import values from "postcss-modules-values";

export const behaviours = {
  LOCAL: "local",
  GLOBAL: "global",
};

export function getDefaultPlugins({
  behaviour,
  generateScopedName,
  exportGlobals,
}) {
  const scope = modulesScope({ generateScopedName, exportGlobals });

  const plugins = {
    [behaviours.LOCAL]: [values, localByDefault, extractImports, scope],
    [behaviours.GLOBAL]: [values, extractImports, scope],
  };

  return plugins[behaviour];
}

export function isValidBehaviour(behaviour) {
  return (
    Object.keys(behaviours)
      .map((key) => behaviours[key])
      .indexOf(behaviour) > -1
  );
}
