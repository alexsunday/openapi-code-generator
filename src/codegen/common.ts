import * as crypto from 'crypto';
import { OpenAPIV2, OpenAPIV3 } from 'openapi-types';

export function sha1(s: string) {
  const shasum = crypto.createHash('sha1');
  shasum.update(s);
  return shasum.digest('hex');
}

// 根据 url 与 method，生成一个hash值
export function apiHash(method: string, reqPath: string) {
  const hashKey = method.toUpperCase() + '-' + reqPath.toLowerCase();
  const s = sha1(hashKey).slice(0, 7);
  return 't_' + s;
}

type EnumObject = {[key: string]: number | string};
type EnumObjectEnum<E extends EnumObject> = E extends {[key: string]: infer ET | string} ? ET : never;

export function enumValues<E extends EnumObject>(enumObject: E): EnumObjectEnum<E>[] {
  return Object.keys(enumObject)
    .filter(key => Number.isNaN(Number(key)))
    .map(key => enumObject[key] as EnumObjectEnum<E>);
}

/*
        GET = "get",
        PUT = "put",
        POST = "post",
        DELETE = "delete",
        OPTIONS = "options",
        HEAD = "head",
        PATCH = "patch",
        TRACE = "trace"
*/

export const httpMethodLists = ["get", "put", "post", "delete", "options", "head", "patch"] as const;
export const httpMethodListsV3 = ["get", "put", "post", "delete", "options", "head", "patch", "trace"] as const;
export type httpMethodType = typeof httpMethodListsV3[number];
// const httpMethodLists = enumValues(OpenAPIV3.HttpMethods);
// export {
//   httpMethodLists
// };
