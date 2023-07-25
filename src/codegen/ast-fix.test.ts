import {test, expect, describe} from '@jest/globals';
import { fixApiTsFile, fixServiceTsFile } from './ast-fix';

const testApiCode = `/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BaseHttpRequest } from './core/BaseHttpRequest';
import type { OpenAPIConfig } from './core/OpenAPI';
import { AxiosHttpRequest } from './core/AxiosHttpRequest';

import { DefaultService } from './services/DefaultService';
import { ProjectadminService } from './services/ProjectadminService';
import { ProjectassetadminService } from './services/ProjectassetadminService';
import { ProjectpropService } from './services/ProjectpropService';
import { ProjectuseradminService } from './services/ProjectuseradminService';

type HttpRequestConstructor = new (config: OpenAPIConfig) => BaseHttpRequest;

export class api {`;

const testServiceCode = `/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AppTypeForAssets } from '../models/AppTypeForAssets';

import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';

export class ProjectassetadminService {

  constructor(public readonly httpRequest: BaseHttpRequest) {}

  /**
   * 是否允许创建新资产
   * 判断一个应用是否有足够权限和资源去创建一个资产
   * @returns any OK
   * @throws ApiError
   */`;

describe('ast-fix', () => {
  test('fix-api', () => {
    const rs = fixApiTsFile(testApiCode);
    console.log(rs);
  });

  test('fix-service', () => {
    const rs = fixServiceTsFile(testServiceCode);
    console.log(rs);
  });
});
