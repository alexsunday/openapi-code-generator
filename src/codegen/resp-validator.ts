import { OpenAPI, OpenAPIV2, OpenAPIV3, OpenAPIV3_1 } from 'openapi-types';

export type openApiSchema = {
  schema: OpenAPIV3.SchemaObject;
}

function recursiveTransformOpenAPIV3Definitions(object: any) {
  // Transformations //
  // OpenAPIV3 nullable
  if (object.nullable === true) {
    if (object.enum) {
      // Enums can not be null with type null
      object.oneOf = [
        { type: 'null' },
        {
          type: object.type,
          enum: object.enum,
        },
      ];
      delete object.type;
      delete object.enum;
    } else if (object.type) {
      object.type = [object.type, 'null'];
    } else if (object.allOf) {
      object.anyOf = [{ allOf: object.allOf }, { type: 'null' }];
      delete object.allOf;
    } else if (object.oneOf || object.anyOf) {
      const arr: any[] = object.oneOf || object.anyOf;
      arr.push({ type: 'null' });
    }

    delete object.nullable;
  }
  // Remove writeOnly properties from required array
  if (object.properties && object.required) {
    const writeOnlyProps = Object.keys(object.properties).filter(
      (key) => object.properties[key].writeOnly
    );
    writeOnlyProps.forEach((value) => {
      const index = object.required.indexOf(value);
      object.required.splice(index, 1);
    });
  }

  Object.keys(object).forEach((attr) => {
    if (typeof object[attr] === 'object' && object[attr] !== null) {
      recursiveTransformOpenAPIV3Definitions(object[attr]);
    } else if (Array.isArray(object[attr])) {
      object[attr].forEach((obj: any) =>
        recursiveTransformOpenAPIV3Definitions(obj)
      );
    }
  });
}

export function transformOpenAPIV3Definitions(schema: schemaType) {
  if (typeof schema !== 'object') {
    return schema;
  }
  const res = JSON.parse(JSON.stringify(schema));
  recursiveTransformOpenAPIV3Definitions(res);
  return res;
}

type schemaType = {
  $schema: string;
  type: string;
  properties: Record<string | number, object>,
  definitions: object,
  components: object,
}

export function getSchemas(responses: Record<string, openApiSchema>, components: OpenAPIV3.ComponentsObject): Record<string, schemaType> {
  const schemas: Record<string, schemaType> = {};

  Object.keys(responses).forEach((name) => {
    const response = responses[name];
    const schema = response.schema;
    schemas[name] = {
      $schema: 'http://json-schema.org/schema#',
      type: 'object',
      properties: {
        response: schema,
      },
      components: components || {},
      definitions: components || {},
    };
  });

  return schemas;
}
