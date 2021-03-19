/* eslint-disable */

const fs = require('fs');
const path = require('path');
const { parse } = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const { transformFromAstSync } = require('@babel/core');

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

test('parseFile', () => {
  expect(parseFile('./data/a.js')).toBe(null);
});
