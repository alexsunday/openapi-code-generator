import {test, expect, describe} from '@jest/globals';
import {tscodegenForDir, collectApiFiles, fileCodeGen, genOpt} from './lib';
import SwaggerParser from '@apidevtools/swagger-parser';
import path from 'path';

const testOpt:genOpt = {
  client: 'axios',
  codeIndent: '2',
  clientName: 'api',
  useOptions: true,
  useUnionTypes: true,
};

describe('codegen', () => {
  test('fileCodeGen-projectAdmin', async () => {
    // const p = './yaml/projectadmin.v1.yaml';
    const p = './yaml/ref-external-test.v1.yaml';
    const f = await fileCodeGen(p, 'dist/output', testOpt);
    expect(f).toBe(true);
  });

  test('fileCodeGen-userPortal', async () => {
    const f = await fileCodeGen('./yaml/user.v1.yaml', 'dist/output', testOpt);
    expect(f).toBe(true);
  });

  test('fileCodeGen-ref-internal-test', async () => {
    const f = await fileCodeGen('./yaml/response-test.yaml', 'dist/output', testOpt);
    expect(f).toBe(true);
  });

  test('fileCodeGen-ref-external-test', async () => {
    const f = await fileCodeGen('./yaml/ref-external-test.v1.yaml', 'dist/output', testOpt);
    expect(f).toBe(true);
  });

  test('collectApiFiles', () => {
    const rs = collectApiFiles('./yaml');
    console.log(rs);
  });

  test('g2', async () => {
    console.log(process.cwd());
    await tscodegenForDir('./yaml', './dist');
  });

  test("whole-test", async () => {
    const rs = await tscodegenForDir("./yaml", "./dist");
    expect(rs).toBe(true);
  });
});

import openapi2schema from './api2schema';
describe("api2schema", () => {
  test('1', async () => {
    const p = './yaml/response-test.yaml';
    const rs = await openapi2schema(path.resolve(p), {
      includeResponses: true,
      dateToDateTime: true,
      supportPatternProperties: true,
      clean: false,
    });
    console.log(rs);
  })
});


import $RefParser from '@alexsunday/json-schema-ref-parser';
describe('bundle-test', () => {
  test('external', async () => {
    const parser = new $RefParser();
    const fullPath = path.resolve('./yaml/ref-external-test.v1.yaml');
    const rs = await parser.bundle(fullPath);
    console.log(rs);
  });
});
