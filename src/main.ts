
// import { Axios } from 'axios';
// import {ApiClient} from './request';

import { t1 } from "./t1";

// function main() {
//   const axios = new Axios();
//   // const api = new ApiClient(undefined, axios);
// }


/**
 * 1. 调用 codegen 库生成 core
 * 1. 可能还需要检测 nodejs 环境，必须>=18.x
 * 1. 检测yaml常见问题 如 重复 operationId
 * 2. 生成 yaml 特定代码
 * 3. 读入 yaml，转换为document，转换并导出 json schema
 */

t1();
