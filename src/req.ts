import { sha1 } from "./common";
import { CancelablePromise, OpenAPIConfig } from "./request";
import { ApiRequestOptions } from "./request/core/ApiRequestOptions";
import { AxiosHttpRequest } from "./request/core/AxiosHttpRequest";
import schema from './request/schema';
import Ajv from 'ajv';


export class MyRequest extends AxiosHttpRequest {
  constructor(config: OpenAPIConfig) {
    super(config);
  }

  private parseSchema(method: string, reqPath: string) {
    // 根据 url 与 method，找到 schema // TODO: 这个获取的方法应该也要被抽象到lib
    const hashKey = method.toUpperCase() + '-' + reqPath;
    const s = sha1(hashKey).slice(0, 7);
    const k = 't_' + s;
    console.log(s);
    return schema.get(k);
  }

  private compileValidataor(schema: any) {
    const ajv = new Ajv();
    return ajv.compile(schema);
  }

  public override request<T>(req: ApiRequestOptions): CancelablePromise<T> {
    console.log(req.url);
    console.log(req.method);
    const schema = this.parseSchema(req.method, req.url);
    const validator = this.compileValidataor(schema);
    const a = super.request<T>(req);
    a.then(v=>{
      if(!validator(v)) {
        throw new Error('json check schema failed!');
      }
      return v;
    })
    return a;
  }
}
