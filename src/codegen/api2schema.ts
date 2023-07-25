import $RefParser from '@alexsunday/json-schema-ref-parser';
import { openapiSchemaToJsonSchema as toJsonSchema } from '@openapi-contrib/openapi-schema-to-json-schema';
import { OpenAPIV3 } from 'openapi-types';
import { httpMethodListsV3 } from './common';
const mergeAllOf = require('json-schema-merge-allof');

export default async function openapi2schema(absFilePath: string, options: any) {
  var schemaOptions: Record<string, any> = {};

  options = options || {};
  options.includeBodies = options.includeBodies === false ? false : true;
  options.includeResponses = options.includeResponses === false ? false : true;
  options.clean = options.clean === true ? true : false;
  options.async = options.async === false ? false : true;

  schemaOptions.dateToDateTime = options.dateToDateTime === true ? true : false;
  schemaOptions.supportPatternProperties = options.supportPatternProperties === true ? true : false;

  const dereferenced = await $RefParser.dereference(absFilePath);
  const paths: OpenAPIV3.PathsObject = (dereferenced as any).paths;
  if (!paths) {
    throw new Error('no paths defined in the specification file');
  }
  return buildPaths(paths, options, schemaOptions);
}

type HttpMethodType = typeof httpMethodListsV3[number];
function buildPaths(paths: OpenAPIV3.PathsObject, options: any, schemaOptions: any) {
  let result: Record<string, Record<HttpMethodType, any>> = {};
  for (const pathName in paths) {
    result[pathName] = {} as any;
    const pathStruct = paths[pathName];
    if (!pathStruct) {
      continue;
    }

    for (const methodName of httpMethodListsV3) {
      const resultMethod: Record<'body' | 'responses', any> = {
        body: undefined,
        responses: undefined,
      };
      const methodStruct = pathStruct[methodName];
      if (!methodStruct) {
        continue;
      }
      if ('$ref' in methodStruct) {
        console.log('todo here2');
        // TODO: here2
        continue;
      }
      
      const reqBody = methodStruct.requestBody;
      if (options.includeBodies && reqBody) {
        if (reqBody && !('$ref' in reqBody)) {
          resultMethod.body = getConvertedSchema('request', reqBody, schemaOptions);
        }
      }

      const rspBody = methodStruct.responses;
      if (options.includeResponses && rspBody) {
        resultMethod.responses = buildResponses(rspBody, schemaOptions);
      }

      if (options.clean && isEmptyObj(resultMethod)) {
        continue;
      }
      result[pathName][methodName] = resultMethod;
    }

    if (options.clean && isEmptyObj(result[pathName])) {
      delete result[pathName];
    }
  }

  return result;
}

function buildResponses(responses: OpenAPIV3.ResponsesObject, schemaOptions: any) {
  const resultResponses: Record<string, any> = {}
  for (const statusCode in responses) {
    const responseData = responses[statusCode];
    if ('$ref' in responseData) {
      // TODO: here1
      continue;
    }
    resultResponses[statusCode] =
      getConvertedSchema('response', responseData, schemaOptions);
  }

  return resultResponses;
}

function getConvertedSchema(type: 'request' | 'response', struct: OpenAPIV3.RequestBodyObject | OpenAPIV3.ResponseObject, options: any) {
  var schema;

  if (!(struct.content && struct.content['application/json'])) {
    return {};
  }

  schema = struct.content['application/json'].schema;
  schema = mergeAllOf(JSON.parse(JSON.stringify(schema)));

  if (type === 'response') {
    options.removeWriteOnly = true;
    options.removeReadOnly = false;
  } else if (type === 'request') {
    options.removeWriteOnly = false;
    options.removeReadOnly = true;
  }

  schema = toJsonSchema(schema, options);
  return schema;
}

function isEmptyObj(obj: object) {
  return Object.keys(obj).length > 0 ? false : true;
}

// function main() {
//   openapi2schema(program.input, options, function(err, res) {
//     if (err) {
//       return console.error(err);
//     }
  
//     print(res);
//   });
// }
