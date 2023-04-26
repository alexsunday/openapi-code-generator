import * as fs from 'fs';
import {openapiSchemaToJsonSchema as toJsonSchema} from '@openapi-contrib/openapi-schema-to-json-schema';
import {OpenAPIV3} from 'openapi-types';
import $RefParser from '@apidevtools/json-schema-ref-parser';

function IsReference (obj: any): boolean {
  if (!!obj && obj.$ref !== null &&
    obj.$ref !== undefined &&
    obj.$ref.length !== null &&
    obj.$ref.length !== undefined &&
    typeof (obj.$ref) === 'string') {
    return true
  }
  return false
}

export async function t1() {
  const oprId = "get-portal-apps-:appId";
  const filePath = './yaml/portal.v1.json';
  const content = fs.readFileSync(filePath, {encoding: 'utf-8'});
  const obj = JSON.parse(content);
  const doc = await $RefParser.bundle(obj, {}) as unknown as OpenAPIV3.Document;
  const paths = doc.paths;
  for(const curPath in paths) {
    const item = paths[curPath];
    if(!item) {
      continue;
    }
    if(!item.get) {
      continue;
    }
    const opr = item.get;
    if(opr.operationId !== oprId) {
      continue;
    }
    const response = item.get.responses;
    const resp = response['200'];
    console.log('ok!');
  }
}
