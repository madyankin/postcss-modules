import test           from 'ava';
import postcss        from 'postcss';
import autoprefixer   from 'autoprefixer';
import fs             from 'fs';
import path           from 'path';
import fileExists     from 'file-exists';
import plugin         from '../src';
import { behaviours } from '../src/behaviours';

const fixturesPath = path.resolve(__dirname, './fixtures');

const cases = {
  plugins:      'saves origin plugins',
  classes:      'processes classes',
  comments:     'preserves comments',
  composes:     'composes rules',
  values:       'processes values',
  interpolated: 'generates scoped name with interpolated string',
  global:       'allows to make CSS global',
};


function generateScopedName(name, filename) {
  const file = path.basename(filename, '.css').replace(/\./g, '_');
  return `_${ file }_${ name }`;
}


Object.keys(cases).forEach((name) => {
  const description = cases[name];

  const scopedNameGenerator = name === 'interpolated'
    ? '[name]__[local]___[hash:base64:5]'
    : generateScopedName;

  const scopeBehaviour = name === behaviours.GLOBAL
    ? behaviours.GLOBAL
    : behaviours.LOCAL;

  test(description, (t) => {
    const sourceFile   = path.join(fixturesPath, 'in', `${ name }.css`);
    const expectedFile = path.join(fixturesPath, 'out', name);
    const source       = fs.readFileSync(sourceFile).toString();
    const expectedCSS  = fs.readFileSync(`${ expectedFile }.css`).toString();
    const expectedJSON = fs.readFileSync(`${ expectedFile }.json`).toString();
    let resultJson;

    const plugins = [
      autoprefixer,
      plugin({
        scopeBehaviour,
        generateScopedName: scopedNameGenerator,
        getJSON: (cssFile, json) => {
          resultJson = json;
        },
      }),
    ];

    return postcss(plugins)
      .process(source, { from: sourceFile })
      .then((result) => {
        t.deepEqual(result.css, expectedCSS);
        t.deepEqual(resultJson, JSON.parse(expectedJSON));
      });
  });
});


test('saves JSON next to CSS by default', (t) => {
  const sourceFile = path.join(fixturesPath, 'in', 'saveJSON.css');
  const source     = fs.readFileSync(sourceFile).toString();
  const jsonFile   = path.join(fixturesPath, 'in', 'saveJSON.css.json');

  if (fileExists(jsonFile)) fs.unlinkSync(jsonFile);

  return postcss([plugin({ generateScopedName })])
    .process(source, { from: sourceFile })
    .then(() => {
      const json = fs.readFileSync(jsonFile).toString();
      fs.unlinkSync(jsonFile);

      t.deepEqual(JSON.parse(json), { title: '_saveJSON_title' });
    });
});


test('processes globalModulePaths option', (t) => {
  const sourceFile  = path.join(fixturesPath, 'in', 'globalModulePaths.css');
  const source      = fs.readFileSync(sourceFile).toString();

  const outFile     = path.join(fixturesPath, 'out', 'globalModulePaths.css');
  const out         = fs.readFileSync(outFile).toString();

  const thePlugin = plugin({
    generateScopedName,
    globalModulePaths:  [/globalModulePaths/],
    getJSON:            () => {},
  });

  return postcss([thePlugin])
    .process(source, { from: sourceFile })
    .then(result => t.deepEqual(result.css, out));
});
