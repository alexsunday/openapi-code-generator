import * as fs from 'fs';
import {openapiSchemaToJsonSchema as toJsonSchema} from '@openapi-contrib/openapi-schema-to-json-schema';
import {OpenAPIV3} from 'openapi-types';
import $RefParser from '@apidevtools/json-schema-ref-parser';
import * as migrate from 'json-schema-migrate';
import { sha1 } from './codegen/common';

function IsReference (obj: any): obj is OpenAPIV3.ReferenceObject {
  if (!!obj && obj.$ref !== null &&
    obj.$ref !== undefined &&
    obj.$ref.length !== null &&
    obj.$ref.length !== undefined &&
    typeof (obj.$ref) === 'string') {
    return true
  }
  return false
}

export async function outSchema() {
  const method = 'get';
  const path = '/portal/webconfig';
  const filePath = './yaml/portal.v1.json';
  const content = fs.readFileSync(filePath, {encoding: 'utf-8'});
  const obj = JSON.parse(content);
  const doc1 = await $RefParser.bundle(obj, {});
  const doc = await $RefParser.dereference(doc1) as unknown as OpenAPIV3.Document;

  const paths = doc.paths;
  const item = paths[path]
  if(!item) {
    return;
  }
  const opr = item[method];
  if(!opr) {
    return;
  }
  const response = opr.responses;
  const resp = response['200'];
  if(IsReference(resp)) {
    console.error('deferenced, but there is a ref yet.');
    return;
  }
  const respContent = resp.content;
  if(!respContent) {
    console.error('response content empty, ignored!');
    return;
  }
  const jsonContent = respContent['application/json'];
  const schemaObj = jsonContent.schema;
  if(!schemaObj) {
    console.error('application/json schema empty, ignored!');
    return;
  }
  if(IsReference(schemaObj)) {
    console.error('application/json schema was a ref yet.');
    return;
  }
  const schema4 = toJsonSchema(schemaObj);
  migrate.draft7(schema4);
  writeOutFile('get', path, schema4);
}

/**
const rs:Map<string, unknown> = new Map();


const t_${hash1} = ${content};
rs.set("t_6304e51", t_6304e51);


export default rs;
 */

function writeOutFile(method: string, curPath:string, schema: unknown) {
  const p = method.toUpperCase() + `-` + curPath;
  const hash1 = sha1(p).slice(0, 7);
  const content = JSON.stringify(schema);
  let tpl = 'const rs:Map<string, unknown> = new Map();\n\n';

  tpl += `const t_${hash1} = ${content};\n`;
  tpl += `rs.set("t_${hash1}", t_${hash1});`

  tpl += '\n\n';
  tpl += 'export default rs;\n';
  fs.writeFileSync('src/request/schema.ts', tpl, {encoding: 'utf-8'});
}
