import postcss      from 'postcss';
import autoprefixer from 'autoprefixer';
import assert       from 'assert';
import fs           from 'fs';
import path         from 'path';
import plugin       from '../src';

const fixturesPath = path.resolve(__dirname, './fixtures');

const cases = {
  'plugins': 'saves origin plugins',
  'classes': 'processes classes',
  'comments': 'preserves comments',
  'composes': 'composes rules with deep imports',
  'composes.shallow': 'composes rules with shallow imports',
};


function generateScopedName(name, filename) {
  const file = path.basename(filename, '.css').replace(/\./g, '_');
  return `_${ file }_${ name }`;
}


function testCss(name) {
  const sourceFile   = path.join(fixturesPath, 'in', `${ name }.css`);
  const expectedFile = path.join(fixturesPath, 'out', name);
  const source       = fs.readFileSync(sourceFile).toString();
  const expectedCSS  = fs.readFileSync(expectedFile + '.css').toString();
  const expectedJSON = fs.readFileSync(expectedFile + '.json').toString();
  let resultJson;

  const result = postcss([
    autoprefixer,
    plugin({
      generateScopedName,
      getJSON: (cssFile, json) => {
        resultJson = json;
      },
    }),
  ]).process(source, { from: sourceFile });

  assert.equal(result.css, expectedCSS);
  assert.deepEqual(resultJson, JSON.parse(expectedJSON));
}


Object.keys(cases).forEach(caseName => {
  const description = cases[caseName];
  it(description, () => testCss(caseName));
});
