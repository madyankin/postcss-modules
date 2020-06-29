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
  global: "allows to make CSS global",
};

function generateScopedName(name, filename) {
  const file = path.basename(filename, ".css").replace(/\./g, "_");
  return `_${file}_${name}`;
}

Object.keys(cases).forEach((name) => {
  const description = cases[name];

  const scopedNameGenerator =
    name === "interpolated"
      ? "[name]__[local]___[hash:base64:5]"
      : generateScopedName;

  const scopeBehaviour =
    name === behaviours.GLOBAL ? behaviours.GLOBAL : behaviours.LOCAL;

  it(description, async () => {
    const sourceFile = path.join(fixturesPath, "in", `${name}.css`);
    const source = fs.readFileSync(sourceFile).toString();

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

    const result = await postcss(plugins).process(source, { from: sourceFile });

    expect(result.css).toMatchSnapshot(`${description} - CSS`);
    expect(resultJson).toMatchSnapshot(`${description} - JSON`);
  });
});

it("saves JSON next to CSS by default", async () => {
  const sourceFile = path.join(fixturesPath, "in", "saveJSON.css");
  const source = fs.readFileSync(sourceFile).toString();
  const jsonFile = path.join(fixturesPath, "in", "saveJSON.css.json");

  if (fs.existsSync(jsonFile)) fs.unlinkSync(jsonFile);

  await postcss([plugin({ generateScopedName })]).process(source, {
    from: sourceFile,
  });

  const json = fs.readFileSync(jsonFile).toString();
  fs.unlinkSync(jsonFile);

  expect(JSON.parse(json)).toMatchObject({ title: "_saveJSON_title" });
});

it("processes globalModulePaths option", async () => {
  const sourceFile = path.join(fixturesPath, "in", "globalModulePaths.css");
  const source = fs.readFileSync(sourceFile).toString();

  const thePlugin = plugin({
    generateScopedName,
    globalModulePaths: [/globalModulePaths/],
    getJSON: () => {},
  });

  const result = await postcss([thePlugin]).process(source, {
    from: sourceFile,
  });

  expect(result.css).toMatchSnapshot("processes globalModulePaths option");
});

it("processes localsConvention with camelCase option", async () => {
  const sourceFile = path.join(fixturesPath, "in", "camelCase.css");
  const source = fs.readFileSync(sourceFile).toString();
  const jsonFile = path.join(fixturesPath, "in", "camelCase.css.json");

  if (fs.existsSync(jsonFile)) fs.unlinkSync(jsonFile);

  await postcss([
    plugin({ generateScopedName, localsConvention: "camelCase" }),
  ]).process(source, { from: sourceFile });

  const json = fs.readFileSync(jsonFile).toString();
  fs.unlinkSync(jsonFile);

  expect(JSON.parse(json)).toMatchObject({
    "camel-case": "_camelCase_camel-case",
    camelCase: "_camelCase_camel-case",
    "camel-case-extra": "_camelCase_camel-case-extra",
    camelCaseExtra: "_camelCase_camel-case-extra",
    FooBar: "_camelCase_FooBar",
    fooBar: "_camelCase_FooBar",
  });
});

it("processes localsConvention with camelCaseOnly option", async () => {
  const sourceFile = path.join(fixturesPath, "in", "camelCase.css");
  const source = fs.readFileSync(sourceFile).toString();
  const jsonFile = path.join(fixturesPath, "in", "camelCase.css.json");

  if (fs.existsSync(jsonFile)) fs.unlinkSync(jsonFile);

  await postcss([
    plugin({ generateScopedName, localsConvention: "camelCaseOnly" }),
  ]).process(source, { from: sourceFile });

  const json = fs.readFileSync(jsonFile).toString();
  fs.unlinkSync(jsonFile);

  expect(JSON.parse(json)).toMatchObject({
    camelCase: "_camelCase_camel-case",
    camelCaseExtra: "_camelCase_camel-case-extra",
    fooBar: "_camelCase_FooBar",
  });
});

it("processes localsConvention with dashes option", async () => {
  const sourceFile = path.join(fixturesPath, "in", "camelCase.css");
  const source = fs.readFileSync(sourceFile).toString();
  const jsonFile = path.join(fixturesPath, "in", "camelCase.css.json");

  if (fs.existsSync(jsonFile)) fs.unlinkSync(jsonFile);

  await postcss([
    plugin({ generateScopedName, localsConvention: "dashes" }),
  ]).process(source, { from: sourceFile });

  const json = fs.readFileSync(jsonFile).toString();
  fs.unlinkSync(jsonFile);

  expect(JSON.parse(json)).toMatchObject({
    "camel-case": "_camelCase_camel-case",
    camelCase: "_camelCase_camel-case",
    "camel-case-extra": "_camelCase_camel-case-extra",
    camelCaseExtra: "_camelCase_camel-case-extra",
    FooBar: "_camelCase_FooBar",
  });
});

it("processes localsConvention with dashes option", async () => {
  const sourceFile = path.join(fixturesPath, "in", "camelCase.css");
  const source = fs.readFileSync(sourceFile).toString();
  const jsonFile = path.join(fixturesPath, "in", "camelCase.css.json");

  if (fs.existsSync(jsonFile)) fs.unlinkSync(jsonFile);

  await postcss([
    plugin({ generateScopedName, localsConvention: "dashes" }),
  ]).process(source, { from: sourceFile });

  const json = fs.readFileSync(jsonFile).toString();
  fs.unlinkSync(jsonFile);

  expect(JSON.parse(json)).toMatchObject({
    camelCase: "_camelCase_camel-case",
    camelCaseExtra: "_camelCase_camel-case-extra",
    FooBar: "_camelCase_FooBar",
  });
});


it("processes localsConvention with function option", async () => {
  const sourceFile = path.join(fixturesPath, "in", "camelCase.css");
  const source = fs.readFileSync(sourceFile).toString();
  const jsonFile = path.join(fixturesPath, "in", "camelCase.css.json");

  if (fs.existsSync(jsonFile)) fs.unlinkSync(jsonFile);

  await postcss([
    plugin({ generateScopedName, localsConvention: (className) => {
      return className.replace('camel-case', 'cc');
    } }),
  ]).process(source, { from: sourceFile });

  const json = fs.readFileSync(jsonFile).toString();
  fs.unlinkSync(jsonFile);

  expect(JSON.parse(json)).toMatchObject({
    cc: "_camelCase_camel-case",
    'cc-extra': "_camelCase_camel-case-extra",
    FooBar: "_camelCase_FooBar",
  });
});

it("processes hashPrefix option", async () => {
  const generateScopedName = "[hash:base64:5]";
  const hashPrefix = "prefix";
  const getJSON = () => {};

  const withoutHashPrefix = plugin({ generateScopedName, getJSON });
  const withHashPrefix = plugin({ generateScopedName, getJSON, hashPrefix });

  const css = ".foo {}";
  const params = { from: "test.css" };

  const result1 = await postcss([withoutHashPrefix]).process(css, params);
  const result2 = await postcss([withHashPrefix]).process(css, params);

  expect(result2.css).toMatchSnapshot("processes hashPrefix option");
  expect(result1.css).not.toEqual(result2.css);
});

it("different instances have different generateScopedName functions", async () => {
  const one = plugin({
    generateScopedName: () => "one",
    getJSON: () => {},
  });

  const two = plugin({
    generateScopedName: () => "two",
    getJSON: () => {},
  });

  const css = ".foo {}";
  const params = { from: "test.css" };

  const resultOne = await postcss([one]).process(css, params);
  const resultTwo = await postcss([two]).process(css, params);

  expect(resultOne.css).toEqual(".one {}");
  expect(resultTwo.css).toEqual(".two {}");
});

it("getJSON with outputFileName", async () => {
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
      },
    }),
  ];

  await postcss(plugins).process(source, {
    from: sourceFile,
    to: `${expectedFile}.css`,
  });

  expect(jsonFileName).toEqual(`${expectedFile}.json`);
  expect(resultJson).toMatchObject(JSON.parse(expectedJSON));
});

it("exposes export tokens for other plugins", async () => {
  const sourceFile = path.join(fixturesPath, "in", "values.css");
  const source = fs.readFileSync(sourceFile).toString();

  const plugins = [
    plugin({
      generateScopedName,
      getJSON: () => {},
    }),
  ];

  const result = await postcss(plugins).process(source, {
    from: sourceFile,
  });

  expect(result.messages).toMatchSnapshot(
    "exposes export tokens for other plugins"
  );
});

it("processes exportGlobals option", async () => {
  const sourceFile = path.join(fixturesPath, "in", "classes.css");
  const source = fs.readFileSync(sourceFile).toString();
  let json;

  await postcss([
    plugin({
      generateScopedName,
      exportGlobals: true,
      getJSON: (_, result) => {
        json = result;
      },
    }),
  ]).process(source, { from: sourceFile });

  expect(json).toMatchObject({
    page: "page",
    title: "_classes_title",
    article: "_classes_article",
  });
});
