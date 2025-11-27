# Zeabur-API-example
Zeabur API Key 应用实例；基于zeabur API KEY通过web管理监控服务；通过API-KEY添加账户，自动获取所有区域下的项目、服务；以及服务状态信息；开机（重启）、停机（挂起）操作。基于Cloudflare Workers完成测试；
## Cloudflare-worker 部署
1. Workers:将`cloudflar_worker.js`代码粘贴到workers
2. KV：绑定一个KV（绑定名称即：`KV`）
