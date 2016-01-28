import test         from 'ava';
import postcss      from 'postcss';
import autoprefixer from 'autoprefixer';
import fs           from 'fs';
import path         from 'path';
import plugin       from '../src';

const fixturesPath = path.resolve(__dirname, './fixtures');

const cases = {
  plugins: 'saves origin plugins',
  classes: 'processes classes',
  comments: 'preserves comments',
  composes: 'composes rules with deep imports',
};


function generateScopedName(name, filename) {
  const file = path.basename(filename, '.css').replace(/\./g, '_');
  return `_${ file }_${ name }`;
}


Object.keys(cases).forEach(name => {
  const description = cases[name];

  test(description, t => {
    const sourceFile   = path.join(fixturesPath, 'in', `${ name }.css`);
    const expectedFile = path.join(fixturesPath, 'out', name);
    const source       = fs.readFileSync(sourceFile).toString();
    const expectedCSS  = fs.readFileSync(`${ expectedFile }.css`).toString();
    const expectedJSON = fs.readFileSync(`${ expectedFile }.json`).toString();
    let resultJson;

    const plugins = [
      autoprefixer,
      plugin({
        generateScopedName,
        getJSON: (cssFile, json) => {
          resultJson = json;
        },
      }),
    ];

    return postcss(plugins)
      .process(source, { from: sourceFile })
      .then(result => {
        t.same(result.css, expectedCSS);
        t.same(resultJson, JSON.parse(expectedJSON));
      });
  });
});
