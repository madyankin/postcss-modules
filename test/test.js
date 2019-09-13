import test from "ava";
import postcss from "postcss";
import autoprefixer from "autoprefixer";
import fs from "fs";
import path from "path";
import plugin from "../src";
import { behaviours } from "../src/behaviours";

const fixturesPath = path.resolve(__dirname, "./fixtures");

const cases = {
  plugins: "saves origin plugins",
  classes: "processes classes",
  comments: "preserves comments",
  composes: "composes rules",
  values: "processes values",
  interpolated: "generates scoped name with interpolated string",
  global: "allows to make CSS global"
};

function generateScopedName(name, filename) {
  const file = path.basename(filename, ".css").replace(/\./g, "_");
  return `_${file}_${name}`;
}

Object.keys(cases).forEach(name => {
  const description = cases[name];

  const scopedNameGenerator =
    name === "interpolated"
      ? "[name]__[local]___[hash:base64:5]"
      : generateScopedName;

  const scopeBehaviour =
    name === behaviours.GLOBAL ? behaviours.GLOBAL : behaviours.LOCAL;

  test(description, async t => {
    const sourceFile = path.join(fixturesPath, "in", `${name}.css`);
    const expectedFile = path.join(fixturesPath, "out", name);
    const source = fs.readFileSync(sourceFile).toString();
    const expectedCSS = fs.readFileSync(`${expectedFile}.css`).toString();
    const expectedJSON = fs.readFileSync(`${expectedFile}.json`).toString();
    let resultJson;

    const plugins = [
      autoprefixer,
      plugin({
        scopeBehaviour,
        generateScopedName: scopedNameGenerator,
        getJSON: (cssFile, json) => {
          resultJson = json;
        }
      })
    ];

    const result = await postcss(plugins).process(source, { from: sourceFile });

    t.deepEqual(result.css, expectedCSS);
    t.deepEqual(resultJson, JSON.parse(expectedJSON));
  });
});

test("saves JSON next to CSS by default", async t => {
  const sourceFile = path.join(fixturesPath, "in", "saveJSON.css");
  const source = fs.readFileSync(sourceFile).toString();
  const jsonFile = path.join(fixturesPath, "in", "saveJSON.css.json");

  if (fs.existsSync(jsonFile)) fs.unlinkSync(jsonFile);

  await postcss([plugin({ generateScopedName })]).process(source, {
    from: sourceFile
  });

  const json = fs.readFileSync(jsonFile).toString();
  fs.unlinkSync(jsonFile);

  t.deepEqual(JSON.parse(json), { title: "_saveJSON_title" });
});

test("processes globalModulePaths option", async t => {
  const sourceFile = path.join(fixturesPath, "in", "globalModulePaths.css");
  const source = fs.readFileSync(sourceFile).toString();

  const outFile = path.join(fixturesPath, "out", "globalModulePaths.css");
  const out = fs.readFileSync(outFile).toString();

  const thePlugin = plugin({
    generateScopedName,
    globalModulePaths: [/globalModulePaths/],
    getJSON: () => {}
  });

  const result = await postcss([thePlugin]).process(source, {
    from: sourceFile
  });

  t.is(result.css, out);
});

test("processes camelCase option", async t => {
  const sourceFile = path.join(fixturesPath, "in", "camelCase.css");
  const source = fs.readFileSync(sourceFile).toString();
  const jsonFile = path.join(fixturesPath, "in", "camelCase.css.json");

  if (fs.existsSync(jsonFile)) fs.unlinkSync(jsonFile);

  await postcss([plugin({ generateScopedName, camelCase: true })]).process(
    source,
    { from: sourceFile }
  );

  const json = fs.readFileSync(jsonFile).toString();
  fs.unlinkSync(jsonFile);

  t.deepEqual(JSON.parse(json), {
    camelCase: "_camelCase_camel-case",
    "camel-case": "_camelCase_camel-case"
  });
});

test("processes hashPrefix option", async t => {
  const generateScopedName = "[hash:base64:5]";
  const hashPrefix = "prefix";
  const getJSON = () => {};

  const withoutHashPrefix = plugin({ generateScopedName, getJSON });
  const withHashPrefix = plugin({ generateScopedName, getJSON, hashPrefix });

  const css = ".foo {}";
  const params = { from: "test.css" };

  const result1 = await postcss([withoutHashPrefix]).process(css, params);
  const result2 = await postcss([withHashPrefix]).process(css, params);

  t.not(result1.css, result2.css);
});

test("different instances have different generateScopedName functions", async t => {
  const one = plugin({
    generateScopedName: () => "one",
    getJSON: () => {}
  });

  const two = plugin({
    generateScopedName: () => "two",
    getJSON: () => {}
  });

  const css = ".foo {}";
  const params = { from: "test.css" };

  const resultOne = await postcss([one]).process(css, params);
  const resultTwo = await postcss([two]).process(css, params);

  t.is(resultOne.css, ".one {}");
  t.is(resultTwo.css, ".two {}");
  t.not(resultOne.css, resultTwo.css);
});

test("getJSON with outputFileName", async t => {
  const sourceFile = path.join(fixturesPath, "in", "test", "getJSON.css");
  const expectedFile = path.join(fixturesPath, "out", "test", "getJSON");
  const source = fs.readFileSync(sourceFile).toString();
  const expectedJSON = fs.readFileSync(`${expectedFile}.json`).toString();
  let jsonFileName;
  let resultJson;

  const plugins = [
    plugin({
      generateScopedName,
      getJSON: (cssFile, json, outputFileName) => {
        jsonFileName = outputFileName.replace(".css", ".json");
        resultJson = json;
      }
    })
  ];

  await postcss(plugins).process(source, {
    from: sourceFile,
    to: `${expectedFile}.css`
  });

  t.deepEqual(jsonFileName, `${expectedFile}.json`);
  t.deepEqual(resultJson, JSON.parse(expectedJSON));
});

test("expose export tokens for other plugins", async t => {
  const sourceFile = path.join(fixturesPath, "in", "values.css");
  const expectedFile = path.join(fixturesPath, "out", "test", "values.css");
  const source = fs.readFileSync(sourceFile).toString();

  const plugins = [
    plugin({
      generateScopedName,
      getJSON: () => {}
    })
  ];

  const result = await postcss(plugins).process(source, {
    from: sourceFile,
    to: `${expectedFile}.css`
  });

  t.deepEqual(result.messages, [
    {
      type: "export",
      plugin: "postcss-modules",
      exportTokens: {
        article: "_values_article",
        colors: '"./values.colors.css"',
        primary: "green",
        secondary: "blue",
        title: "_values_title"
      }
    }
  ]);
});
