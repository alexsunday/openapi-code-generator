import * as fs from 'fs';
import * as path from 'path';
import * as openApiTsCodeGen from 'openapi-typescript-codegen';
import type { OpenAPI, OpenAPIV2, OpenAPIV3, OpenAPIV3_1 } from 'openapi-types';
import SwaggerParser from '@apidevtools/swagger-parser';
import { httpMethodListsV3, httpMethodType } from './common';
import Ajv from 'ajv';

import $RefParser from '@alexsunday/json-schema-ref-parser';
import $Refs from '@alexsunday/json-schema-ref-parser/dist/lib/refs';
import { fixApiTsFile, fixServiceTsFile } from './ast-fix';
import { getSchemas, openApiSchema, transformOpenAPIV3Definitions } from './resp-validator';


type clientType = 'fetch' | 'xhr' | 'node' | 'axios' | 'angular';
// // npx openapi --useUnionTypes --name ApiClient -i .\yaml\portal.v1.json -o src\request\ -c axios
export type genOpt = {
  useOptions: boolean;
  useUnionTypes: boolean;
  codeIndent: '4' | '2' | 'tab';
  clientName: string;
  client: clientType;
}

const defaultOpt: genOpt = {
  useOptions: true,
  useUnionTypes: true,
  codeIndent: '2',
  client: 'axios',
  clientName: 'api',
};

/**
 * 
 * @param inDir 输入文件夹，包含 openapi 文件定义的父文件夹
 * @param outDir 输出文件夹
 * @param options 可选的选项
 */
export async function tscodegenForDir(inDir: string, outDir: string, options?: genOpt): Promise<void> {
  const opt = !!options ? options : defaultOpt;
  await coreGen(outDir, opt);
  const apiFiles = collectApiFiles(inDir);
  for (let i = 0; i !== apiFiles.length; i++) {
    await fileCodeGen(apiFiles[i], outDir, opt);
  }
}

export function collectApiFiles(inDir: string): string[] {
  if (!fs.existsSync(inDir)) {
    console.error(`${inDir} not exists, ignored!`);
    return [];
  }
  const fileLists = fs.readdirSync(inDir, { withFileTypes: true });
  const apiFiles: string[] = [];
  const dirNames = new Set<string>();
  fileLists.forEach(item => {
    // 暂不递归
    if (item.isDirectory()) {
      return;
    }
    // 只处理「普通文件」
    if (!item.isFile()) {
      return;
    }
    const fname = item.name;
    const extPos = fname.lastIndexOf('.');
    // 必须有「扩展名」
    if (extPos === -1) {
      return;
    }
    const fExt = fname.slice(extPos + 1).toLowerCase();
    // 只处理以下3种扩展名后缀的文件 大小写不限
    const allow = new Set(['yml', 'yaml', 'json']);
    if (!allow.has(fExt)) {
      return;
    }

    // 生成代码时，用不包含后缀的文件名做为文件夹名称 所以
    // 还要考虑同名但不同后缀的情况 如一个文件夹下有 pet.json, pet.yml
    const baseName = fname.slice(0, extPos);
    if (dirNames.has(baseName)) {
      return;
    }
    dirNames.add(baseName);

    // 需要把每个文件都转换为绝对路径
    const fileAbsPath = path.resolve(path.join(inDir, fname));
    apiFiles.push(fileAbsPath);
  });

  return apiFiles;
}

/**
 * 加载并解析文档 顺带校验、验证文档，测试响应体是否能被 ajv 编译
 * @param filePath 相对路径
 * @returns 解析后的文档
 */
async function loadUseRefParser(filePath: string): Promise<OpenAPI.Document> {
  const parser = new $RefParser();
  const absFilePath = path.resolve(filePath);
  const doc: OpenAPI.Document = await parser.bundle(absFilePath) as any;
  // 实验发现 下面的 swaggerParser.validate 可能会修改原始的doc的值
  // 逐个编译ajv validators，并提出警告
  testValidators(parser.$refs, doc);
  // 使其包含循环引用 故先复制一份用于校验
  // const rDoc: OpenAPI.Document = JSON.parse(JSON.stringify(doc));
  // const validator = new SwaggerParser();
  // // 校验一下api文档的正确性
  // await validator.validate(rDoc);
  // 将 bundle 之后的 JSON 导过去
  // 返回原始值
  return doc;
}

async function parserDoc(filePath: string): Promise<OpenAPI.Document> {
  // const parser = new $RefParser();
  const absFilePath = path.resolve(filePath);
  // const doc: OpenAPI.Document = await parser.bundle(absFilePath) as any;
  const validator = new SwaggerParser();
  // 校验一下api文档的正确性
  return await validator.bundle(absFilePath);
  // 将 bundle 之后的 JSON 导过去
  // 逐个编译ajv validators，并提出警告
  // testValidators(parser.$refs, doc);
}



export async function fileCodeGen(input: string, outDir: string, opt: genOpt): Promise<boolean> {
  // 先得拆出 扩展名与文件名
  const baseName = path.basename(input);
  const pos = baseName.lastIndexOf('.');
  if (pos === -1) {
    console.error(`cannot guess file extension from name [${baseName}]`);
    return false;
  }
  const baseFileName = baseName.slice(0, pos);
  // 得检查文件名，不能叫 'core' 
  if(baseFileName === 'core') {
    console.error(`cannot use core as openapi filename [${baseName}]`);
    return false;
  }
  // 输出路径应加入 baseName
  const dstOutDir = path.join(outDir, baseFileName);
  if (!fs.existsSync(dstOutDir)) {
    fs.mkdirSync(dstOutDir, { recursive: true });
  }

  /**
   * 这里太奇怪了 @apidevtools/swagger-parser 依赖的旧版的 ref-parser
   * 但是旧版的 ref-parser 导出的 外部依赖，路径中包含 #paths/xxx 无法被 ajv 识别
   * */
  // const doc = await parserDoc(input);
  /**
   * 而 新版的 @apidevtools/json-schema-ref-parser 导出的外部依赖则能正确的被识别
   * 但令人无法接受的是，新版的 ref-parser 对路径处理很傻逼，所以我自己改了改，使其只接受绝对路径
   * 但 npm 发布私有包要花钱... 
   */
  const doc = await loadUseRefParser(input);

  // 代码生成
  await openApiTsCodeGen.generate({
    input: doc,
    output: dstOutDir,
    httpClient: opt.client,
    clientName: opt.clientName,
    useUnionTypes: opt.useUnionTypes,
    useOptions: opt.useOptions,
    indent: opt.codeIndent,
    exportCore: false,
    exportModels: true,
    exportServices: true,
    exportSchemas: false,
  });
  // 需要修正生成的文件 core 路径指向需要修正
  // 首先修正 api.ts
  fixApiImport(path.join(dstOutDir, 'api.ts'));
  // 再修正 services/*.ts
  fixServiceImport(path.join(dstOutDir, 'services'));

  const jsonDocContent = JSON.stringify(doc, null, 2);
  const jsonDocPath = path.resolve(dstOutDir, 'api.json');
  fs.writeFileSync(jsonDocPath, jsonDocContent, { encoding: 'utf-8' });
  return true;
}

function fixApiImport(codePath: string) {
  const content = fs.readFileSync(codePath, {encoding: 'utf-8'});
  const code = fixApiTsFile(content);
  fs.writeFileSync(codePath, code, {encoding: 'utf-8'});
}

// services 下有很多文件，要逐一修正
function fixServiceImport(svrDir: string) {
  fs.readdirSync(svrDir, {withFileTypes: true}).forEach(item=>{
    if(!item.isFile()) {
      return;
    }
    const fileName = item.name;
    if(!fileName.toLowerCase().endsWith('.ts')) {
      return;
    }
    const codePath = path.join(svrDir, fileName);
    const origin = fs.readFileSync(codePath, {encoding: 'utf-8'});
    const fixedCode = fixServiceTsFile(origin);
    fs.writeFileSync(codePath, fixedCode, {encoding: 'utf-8'});
  });
}

export function testValidators(parser: $Refs, doc: OpenAPI.Document) {
  const docVer = docApiVersion(doc);
  if (docVer === '3.0') {
    return testValidatorV30(parser, doc as OpenAPIV3.Document);
  }
}

type checkResult = boolean | 'ignored';
function testValidatorV30(refs: $Refs, doc: OpenAPIV3.Document) {
  walkApiResponse(doc, (pathUrl, method, httpCode, rsp) => {
    let rspStruct: OpenAPIV3.ResponseObject;
    if ('$ref' in rsp) {
      rspStruct = refs.get(rsp.$ref) as any;
    } else {
      rspStruct = rsp as OpenAPIV3.ResponseObject;
    }
    if (!rspStruct) {
      console.warn(`${pathUrl} ${method} ${httpCode} response struct empty!`);
      return 'ignored';
    }
    const content = rspStruct.content;
    if (!content) {
      // console.warn(`${pathUrl} ${method} ${httpCode} response content empty, check ignored`);
      return 'ignored';
    }
    // 多种返回 暂时只考虑 *json*
    // 如果有多个 *json 怎么办？要处理
    // TODO: here1
    for (const mediaType in content) {
      if (mediaType.indexOf('json') === -1) {
        console.warn(`${pathUrl} ${method} ${httpCode} ${mediaType} check ignored`);
        continue;
      }
      const schema = content[mediaType].schema;
      if (!schema) {
        console.warn(`${pathUrl} ${method} ${httpCode} ${mediaType} schema empty, check ignored`);
        continue;
      }

      let respSchema: OpenAPIV3.SchemaObject;
      if ('$ref' in schema) {
        respSchema = refs.get(schema.$ref) as any;
      } else {
        respSchema = schema;
      }

      const rs: Record<string, openApiSchema> = {};
      rs[httpCode] = {
        schema: respSchema,
      }
      const components = doc.components ? doc.components : {};
      const schemas = getSchemas(rs, components);

      const v = new Ajv({
        useDefaults: true,
        allErrors: true,
        strict: false,
        logger: false,
      });

      // 试一下能否编译这个 json-schema 如果有问题可以现在报错 避免运行时出错
      try {
        const obj = transformOpenAPIV3Definitions(schemas[httpCode])
        v.compile(obj);
        // console.log(`${pathUrl} ${method} ${httpCode} compile succeed!`);
      } catch(e) {
        console.warn(`${pathUrl} ${method} ${httpCode} compile failed!`);
        console.error(e);
      }
    }
    return true;
  });
}

// 遍历所有的接口的响应
type apiRespWalker = (pathUrl: string, method: httpMethodType, httpCode: string, opr: apiResponseType) => checkResult;
type apiResponseType = OpenAPIV3.ReferenceObject | OpenAPIV3.ResponseObject | OpenAPIV2.Response;
function walkApiResponse(doc: OpenAPI.Document, walker: apiRespWalker) {
  const paths = doc.paths;
  for (const curPath in paths) {
    const pathItem = paths[curPath];
    if (!pathItem) {
      console.warn(`${curPath} empty, ignored!`);
      continue;
    }
    for (const method of httpMethodListsV3) {
      const oprItem = getOprItem(method, pathItem);
      if (!oprItem) {
        continue;
      }
      const rspObjs = oprItem.responses;
      for (const httpCode in rspObjs) {
        const curRspObj = rspObjs[httpCode];
        if (!curRspObj) {
          console.warn(`${method} ${curPath} ${httpCode} empty, ignored!`);
          continue;
        }
        walker(curPath, method, httpCode, curRspObj);
      }
    }
  }
}
// openapi v3 之后才支持 trace 方法
function getOprItem(method: httpMethodType, p: OpenAPIV2.PathItemObject | OpenAPIV3.PathItemObject | OpenAPIV3_1.PathItemObject) {
  if (method === 'trace') {
    return (p as (OpenAPIV3.PathItemObject | OpenAPIV3_1.PathItemObject)).trace;
  } else {
    return p[method];
  }
}

type docVerTypes = '2' | '3.0' | '3.1';
function docApiVersion(doc: OpenAPI.Document): docVerTypes {
  let docVer: docVerTypes = '3.0';
  if ('swagger' in doc) {
    docVer = '2';
  } else {
    const ver = doc.openapi.trim();
    if (ver.startsWith('3.1')) {
      docVer = '3.1';
    }
  }
  return docVer;
}

function coreGen(outDir: string, opt?: genOpt) {
  const coreSchema: OpenAPIV3.Document = {
    "openapi": "3.0.0",
    "info": {
      "version": "0.0.1",
      "title": "hello, world"
    },
    "paths": {}
  }

  return openApiTsCodeGen.generate({
    input: coreSchema,
    output: outDir,
    httpClient: opt?.client,
    clientName: opt?.clientName,
    useUnionTypes: opt?.useUnionTypes,
    useOptions: opt?.useOptions,
    indent: opt?.codeIndent,
    exportCore: true,
    exportModels: false,
    exportServices: false,
    exportSchemas: false,
  });
}
