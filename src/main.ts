
import { MyRequest } from './req';
import {ApiClient} from './request';


async function main() {
  const api = new ApiClient({}, MyRequest);
  const rs = await api.default.getPortalWebconfig();
  console.log(rs);
}
// npx openapi --useUnionTypes --name ApiClient -i .\yaml\portal.v1.json -o src\request\ -c axios

main();

/**
 * 1. 调用 codegen 库生成 core
 * 1. 可能还需要检测 nodejs 环境，必须>=18.x
 * 1. 检测yaml常见问题 如 重复 operationId
 * 2. 生成 yaml 特定代码
 * 3. 读入 yaml，转换为document，转换并导出 json schema
 */

// import { outSchema } from "./t1";
// outSchema();
