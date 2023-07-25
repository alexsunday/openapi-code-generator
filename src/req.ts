import { sha1 } from "./codegen/common";
import { CancelablePromise, OpenAPIConfig } from "./request";
import { ApiRequestOptions } from "./request/core/ApiRequestOptions";
import { AxiosHttpRequest } from "./request/core/AxiosHttpRequest";
import schema from './request/schema';
import Ajv from 'ajv';


export const apiCheckErr = new Error('json check schema failed!');
export class MyRequest extends AxiosHttpRequest {
  constructor(config: OpenAPIConfig) {
    super(config);
  }

  private parseSchema(method: string, reqPath: string) {
    // 根据 url 与 method，找到 schema // TODO: 这个获取的方法应该也要被抽象到lib
    const hashKey = method.toUpperCase() + '-' + reqPath;
    const s = sha1(hashKey).slice(0, 7);
    const k = 't_' + s;
    return schema.get(k);
  }

  // TODO: 这里可以被预编译
  private compileValidataor(schema: any) {
    const ajv = new Ajv({
      strictSchema: false,
    });
    return ajv.compile(schema);
  }

  public override request<T>(req: ApiRequestOptions): CancelablePromise<T> {
    const schema = this.parseSchema(req.method, req.url);
    const validator = this.compileValidataor(schema);
    const rs = new CancelablePromise<T>(async (resolve, reject, onCancel) => {
      const rsp = await super.request<T>(req);
      if(!validator(rsp)) {
        reject(apiCheckErr);
        return;
      }
      resolve(rsp);
    });
    return rs;
  }
}
