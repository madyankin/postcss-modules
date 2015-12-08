import postcss      from 'postcss';
import autoprefixer from 'autoprefixer';
import assert       from 'assert';
import fs           from 'fs';
import path         from 'path';
import plugin       from '../src';

const noop = () => {};

const fixturesPath = path.resolve(__dirname, './fixtures');

const cases = {
  'composes': 'composes',
};


function generateScopedName(name, filename, css) {
  const i         = css.indexOf('.' + name);
  const numLines  = css.substr(0, i).split(/[\r\n]/).length;
  const file      = path.basename(filename, '.css').replace('.', '_');

  return `_${ file }_${ numLines }_${ name }`;
}


function testCss(name) {
  const sourceFile   = path.join(fixturesPath, 'in', `${ name }.css`);
  const expectedFile = path.join(fixturesPath, 'out', `${ name }.css`);
  const source       = fs.readFileSync(sourceFile).toString();
  const expected     = fs.readFileSync(expectedFile).toString();

  const result = postcss([
    autoprefixer,
    plugin({ generateScopedName }),
  ]).process(source, { from: sourceFile });

  assert.equal(result.css, expected);
}


Object.keys(cases).forEach(caseName => {
  const description = cases[caseName];
  it(description, () => testCss(caseName));
});


it('exports JSON', () => {
  const name         = 'composes';
  const sourceFile   = path.join(fixturesPath, 'in', `${ name }.css`);
  const expectedFile = path.join(fixturesPath, 'out', `${ name }.json`);
  const source       = fs.readFileSync(sourceFile).toString();
  const expected     = fs.readFileSync(expectedFile).toString();
  let resultJson;

  const processor = postcss([
    autoprefixer,
    plugin({
      generateScopedName,
      getJSON: (cssFile, json) => {
        resultJson = json;
      },
    }),
  ]);

  const result = processor.process(source, { from: sourceFile });
  noop(result.css);

  assert.deepEqual(resultJson, JSON.parse(expected));
});
