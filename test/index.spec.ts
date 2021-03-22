import TinyWebpack from '../src';
import { expect } from 'chai';

const entry = './data/a.js';

const tinyWebpack = new TinyWebpack({
  baseDir: __dirname,
  entry,
});

it('parseFile', () => {
  expect(tinyWebpack['parseFile'](entry)).to.eqls({
    code:
      '"use strict";\n\nvar _b = require("./b.js");\n\n// eslint-disable-next-line no-console\nconsole.log(_b.b);',
    deps: {
      './b.js': 'data\\b.js',
    },
    filename: './data/a.js',
  });
});

it('generateGraph', () => {
  expect(tinyWebpack['generateGraph']()).to.eqls({
    './data/a.js': {
      code:
        '"use strict";\n\nvar _b = require("./b.js");\n\n// eslint-disable-next-line no-console\nconsole.log(_b.b);',
      deps: {
        './b.js': 'data\\b.js',
      },
    },
    'data\\b.js': {
      code:
        '"use strict";\n\nObject.defineProperty(exports, "__esModule", {\n  value: true\n});\nexports.b = void 0;\nvar b = \'hello world\';\nexports.b = b;',
      deps: {},
    },
  });
});

it('printCode', () => {
  console.log(tinyWebpack.printCode());

  expect(tinyWebpack.printCode()).to.equals(
    '(function (graph) {\n    function require(module) {\n      function innerRequire(relativePath) {\n        return require(graph[module].deps[relativePath]);\n      }\n      var exports = {};\n      (function(require,exports,code){\n        eval(code);\n      })(innerRequire,exports,graph[module].code);\n      return exports;\n    }\n\n    require(\'./data/a.js\');\n  })({"./data/a.js":{"code":"\\"use strict\\";\\n\\nvar _b = require(\\"./b.js\\");\\n\\n// eslint-disable-next-line no-console\\nconsole.log(_b.b);","deps":{"./b.js":"data\\\\b.js"}},"data\\\\b.js":{"code":"\\"use strict\\";\\n\\nObject.defineProperty(exports, \\"__esModule\\", {\\n  value: true\\n});\\nexports.b = void 0;\\nvar b = \'hello world\';\\nexports.b = b;","deps":{}}})',
  );
});
