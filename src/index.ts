import fs from 'fs';
import path from 'path';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import { transformFromAstSync } from '@babel/core';

interface TinyWebpackConfig {
  baseDir?: string;
  entry: string;
}

interface Graph {
  [key: string]: {
    deps: Record<string, string>;
    code: string;
  };
}

export default class TinyWebpack {
  private config: TinyWebpackConfig;

  constructor(config: TinyWebpackConfig) {
    this.config = config;
  }

  public printCode() {
    const { entry } = this.config;
    // 这里需要使用JSON.stringify字符串化，不然下面字符串化的时候会直接变成[object Object]
    const graph = JSON.stringify(this.generateGraph());

    return `(function (graph) {
    function require(module) {
      function innerRequire(relativePath) {
        return graph[module].deps[relativePath];
      }
      var exports = {};
      (function(require,exports,code){
        eval(code);
      })(innerRequire,exports,graph[module].code)
    }

    require('${entry}');
  })(${graph})`;
  }

  private generateGraph() {
    const { entry } = this.config;

    const entryModule = this.parseFile(entry);
    const graphArray = [entryModule];

    // 将所有依赖加入到graphArray中
    for (let i = 0; i < graphArray.length; i++) {
      const { deps } = graphArray[i];
      Object.keys(deps).forEach(key => {
        const depModule = this.parseFile(deps[key]);
        graphArray.push(depModule);
      });
    }

    // 生成依赖图谱
    const graph: Graph = {};
    graphArray.forEach(({ code, deps, filename }) => {
      graph[filename] = { code, deps };
    });

    return graph;
  }

  private parseFile(filename: string) {
    const { baseDir } = this.config;

    const content = fs.readFileSync(transformPath(filename, baseDir), {
      encoding: 'utf8',
    });
    const ast = parse(content, { sourceType: 'module' });
    const deps: Record<string, string> = {};

    // 收集依赖
    traverse(ast, {
      ImportDeclaration({ node }) {
        const dirname = path.dirname(filename);
        const dep = path.join('./', dirname, node.source.value);
        deps[node.source.value] = dep;
      },
    });

    // 转化代码
    const result = transformFromAstSync(ast, undefined, {
      presets: ['@babel/preset-env'],
    });

    return {
      filename,
      deps,
      code: result?.code || '',
    };
  }
}

function transformPath(filename: string, baseDir?: string) {
  return path.isAbsolute(filename)
    ? filename
    : path.resolve(baseDir || process.cwd(), filename);
}
