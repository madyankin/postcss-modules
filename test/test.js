import postcss      from 'postcss';
import autoprefixer from 'autoprefixer';
import assert       from 'assert';
import fs           from 'fs';
import path         from 'path';
import plugin       from '../src';

const FIXTURES = './test/fixtures/';


function generateScopedName(name, filename, css) {
  const i         = css.indexOf('.' + name);
  const numLines  = css.substr(0, i).split(/[\r\n]/).length;
  const file      = path.basename(filename, '.css');

  return `_${ file }_${ numLines }_${ name }`;
}

it('works', () => {
  const cssFileName          = path.resolve(FIXTURES, 'in/styles.css');
  const cssFileNameExpected  = path.resolve(FIXTURES, 'out/styles.css');
  const jsonFilenameExpected = path.resolve(FIXTURES, 'out/styles.json');
  const css                  = fs.readFileSync(cssFileName).toString();
  const cssExpected          = fs.readFileSync(cssFileNameExpected).toString();
  const jsonExpected         = fs.readFileSync(jsonFilenameExpected).toString();
  let resultJson;
  let passedCssFileName;

  const processor = postcss([
    autoprefixer,
    plugin({
      generateScopedName,
      getJSON: (cssFile, json) => {
        passedCssFileName = cssFile;
        resultJson = json;
      },
    }),
  ]);

  const result = processor.process(css, { from: cssFileName });
  assert.equal(result.css, cssExpected);
  assert.equal(passedCssFileName, cssFileName);
  assert.deepEqual(resultJson, JSON.parse(jsonExpected));
});
