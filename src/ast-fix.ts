/**
 * 由于 typescript-codegen 库生成的 文件 其 core 引用指向固定
 * 在批量yaml生成的场景不太合适
 * 但直接修改其源码的 模板 也不合适，无法融入上游
 * 于是
 * 在此处，对生成完毕的代码执行修正，方法有两种
 * 1. 使用正则表达式 这个比较简单
 * 2. 使用 ast parser 执行修改，这复杂很多，但似乎更可靠？
 * 
 * 但在目前的场景里，似乎正则就足够了，需要修正的文件有
 * 1. api.ts ，前面3句 将原本的 ./core 替换为 ../core 且其他部分是固定的 即可以用作特征字串
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
import type { OpenAPIConfig } from '../core/OpenAPI';
import { AxiosHttpRequest } from '../core/AxiosHttpRequest';

  * 2. services/*.ts 中间两句 将原本的../core 替换为 ../../core 且其他部分是固定的 即可以用作特征字串
import type { CancelablePromise } from '../../core/CancelablePromise';
import type { BaseHttpRequest } from '../../core/BaseHttpRequest';
 *
 */

const apiPattern = /s*?\}\s*?from\s*?\'\.\/core\//gms;
export function fixApiTsFile(code: string): string {
  return code.replace(apiPattern, "} from '../core/");
}

const servicePattern = /\}\s*?from\s*?\'\.\.\/core\//gms;
export function fixServiceTsFile(code: string): string {
  return code.replace(servicePattern, "} from '../../core/");
}
