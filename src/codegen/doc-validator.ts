import * as migrate from 'json-schema-migrate';
import {OpenAPIV2, OpenAPIV3, OpenAPIV3_1} from 'openapi-types';
import Ajv, { ValidateFunction } from 'ajv';
import addFormats from "ajv-formats"

// openapi document 的 json schema 文档来自于 https://github.com/OAI/OpenAPI-Specification/tree/main/schemas
// 更新后需要重新编译 下面的3个文档应该被编译到最终js中
const d20 = require('./schemas/v2.0.json');
const d30 = require('./schemas/v3.0.json');
const d31 = require('./schemas/v3.1.json');

/**
 * check openapi document
 * 初始化openapi 文档的 json schema
 * 用于后面校验api文档格式、有效性的！
 */
export class docValidator {  
  private v20?: ValidateFunction<OpenAPIV2.Document>;
  private v30?: ValidateFunction<OpenAPIV3.Document>;
  private v31?: ValidateFunction<OpenAPIV3_1.Document>;

  get validator20() {
    if(!this.v20) {
      throw new Error('doc validator not initialized correct.');
    }
    return this.v20!;
  }

  get validator30() {
    if(!this.v30) {
      throw new Error('doc validator not initialized correct.');
    }
    return this.v30!;
  }

  get validator31() {
    if(!this.v31) {
      throw new Error('doc validator not initialized correct.');
    }
    return this.v31!;
  }

  public init() {
    // v20 与 v30 的 json schema 默认是 draft-04 标准的
    // 需要迁移到 07 才能被最新的ajv 库使用
    migrate.draft7(d20);
    this.v20 = this.initDoc(d20);
    migrate.draft7(d30);
    this.v30 = this.initDoc(d30);
    this.v31 = this.initDoc(d31);
  }

  private initDoc<DOC>(d: any) {
    const ajv = new Ajv({
      strict: false,
      strictSchema: false,
    });
    addFormats(ajv);
    return ajv.compile<DOC>(d);
  }
}
