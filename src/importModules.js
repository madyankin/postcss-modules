import atImport from 'postcss-import';
import plugins  from './plugins';

const importRegexp = /\:import\(['"](.*)['"]\)/;

export default function importModule(css, result) {
  css.each(importRule => {
    const match = importRegexp.exec(importRule.selector);

    if (!match) return;

    const moduleName = match[1];
    css.prepend({ name: 'import', params: `"${ moduleName }"` });
  });

  // Replace @import directives with imported modules
  atImport({ plugins })(css, result);
}
