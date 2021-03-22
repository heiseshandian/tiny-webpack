/* eslint-disable */

const fs = require('fs');
const path = require('path');
const { parse } = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const { transformFromAstSync } = require('@babel/core');
const assert = require('assert');

const baseDir = __dirname;

function parseFile(filename) {
  const content = fs.readFileSync(transformPath(filename, baseDir), {
    encoding: 'utf8',
  });
  const ast = parse(content, { sourceType: 'module' });
  const deps = {};

  // 收集依赖
  traverse(ast, {
    ImportDeclaration({ node }) {
      const dirname = path.dirname(filename);
      const dep = path.join('./', dirname, node.source.value);
      deps[node.source.value] = dep;
    },
  });

  // 转化代码
  const result = transformFromAstSync(ast);

  return {
    filename,
    deps,
    code: result.code || '',
  };
}

function transformPath(filename, baseDir) {
  return path.isAbsolute(filename)
    ? filename
    : path.resolve(baseDir || process.cwd(), filename);
}

it('parseFile', () => {
  assert.strictEqual(
    parseFile('./data/a.js'),
    "{\n    code:\n      '\"use strict\";\n\nvar _b = require(\"./b.js\");\n\n// eslint-disable-next-line no-console\nconsole.log(_b.b);',\n    deps: {\n      './b.js': 'data\\b.js',\n    },\n    filename: './data/a.js',\n  }",
  );
});
