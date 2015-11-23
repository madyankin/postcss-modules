import postcss from 'postcss';
import assert  from 'assert';
import fs      from 'fs';
import path    from 'path';
import plugin  from '../src';

const FIXTURES = './test/fixtures/';


function generateScopedName(name, filename, css) {
  const i         = css.indexOf('.' + name);
  const numLines  = css.substr(0, i).split(/[\r\n]/).length;
  const file      = path.basename(filename, '.css');

  return `_${ file }_${ numLines }_${ name }`;
}

it('works', () => {
  const cssFileName          = path.join(FIXTURES, 'in/styles.css');
  const cssFileNameExpected  = path.join(FIXTURES, 'out/styles.css');
  const jsonFilenameExpected = path.join(FIXTURES, 'out/styles.json');
  const css                  = fs.readFileSync(cssFileName).toString();
  const cssExpected          = fs.readFileSync(cssFileNameExpected).toString();
  const jsonExpected         = fs.readFileSync(jsonFilenameExpected).toString();

  const processor = postcss([
    plugin({
      generateScopedName,
      getJSON: json => assert.deepEqual(json, JSON.parse(jsonExpected)),
    }),
  ]);

  const result = processor.process(css, { from: cssFileName });

  assert.equal(result.css, cssExpected);
});
