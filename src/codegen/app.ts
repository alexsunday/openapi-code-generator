import * as fs from 'fs';
// import {openapiSchemaToJsonSchema as toJsonSchema} from '@openapi-contrib/openapi-schema-to-json-schema';
// import {OpenAPIV3} from 'openapi-types';
// import $RefParser from '@apidevtools/json-schema-ref-parser';
// import * as migrate from 'json-schema-migrate';

/**
 * 应该可以直接用作应用程序 也应可以被当作库使用 app 提供watch功能
 * 
 * 基本功能
 * 1. 处理多 yaml, 应能处理 yaml/json 格式
 * 1. 生成 json schema 并导出到同目录
 * 1. 生成前最好是先用 openapi schema 校验一下原始文档是否合法
 * 1. 生成前最好是先检查一下 json schema 是否是合法的，即先运行时编译一次，看是否会有编译异常
 * 1. 同时单独提供 java lib helper
 * 1. 
 * 
 * 应用流程
 * 1. 可能还需要检测 nodejs 环境，必须>=18.x
 * 1. 配置解析 客户端类型fetch/axios/xhr，枚举，自定义clientName等
 * 1. 调用 codegen 库生成 core
  * 1. 检测yaml常见问题 如 重复 operationId
  * 2. 生成 yaml 特定代码
  * 3. 读入 yaml，转换为document，转换并导出 json schema
 * 1. 单独编译一个vue-cli-plugin.js提供出来 用户自己在package.json里指定使用即可
 * 
 * 输出内容
 * 1. lib.js, lib.d.ts & doc
 * 2. codegen.js require(../lib.js)
 * 3. java-swagger-helper.js & helper.doc.md
 * 4. readme.md & package.json
 * 
 * 配置内容
 *  useOptions: true,
 *  useUnionTypes: true,
 *  codeIndent: '2',
 *  client: 'axios',
 *  clientName: 'api',
 *  inputDir: '',
 *  outputDir: '',
**/

import {tscodegenForDir} from './lib';
import type{ genOpt } from './lib';
import minimist from 'minimist';

function main() {
  const argv = minimist(process.argv.slice(2), {
    boolean: ['useOptions', 'useUnionTypes'],
    default: {
      useOptions: true,
      useUnionTypes: true,
      codeIndent: '2',
      client: 'axios',
      clientName: 'api',
    }
  });
  if(!argv.inputDir || !argv.outputDir) {
    console.error('inputDir or outputDir not specified!');
    process.exit(1);
  }

  const inDir = argv.inputDir;
  const outDir = argv.outputDir;
  if(typeof inDir !== 'string' || typeof outDir !== 'string') {
    console.error('inputDir or outputDir invalid!');
    process.exit(1);
  }
  if(!fs.existsSync(inDir)) {
    console.error(`${inDir} not exists!`);
    process.exit(2);
  }
  // 检查目标文件夹是否存在 如若不存在则建立
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  // TODO: check argv field type!
  const opt:genOpt = {
    useOptions: argv.useOptions,
    useUnionTypes: argv.useUnionTypes,
    codeIndent: argv.codeIndent,
    client: argv.client,
    clientName: argv.clientName,
  }

  tscodegenForDir(inDir, outDir, opt);
}

main();
