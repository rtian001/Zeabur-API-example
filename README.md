# Zeabur-API-example
> Zeabur API Key 应用实例；
>
> 基于zeabur API KEY通过web管理监控服务；
>
> 通过API-KEY添加账户，自动获取所有区域下的项目、服务；以及服务状态信息；
>
> 开机（重启）、停机（挂起）操作。基于Cloudflare Workers完成测试；

<img width="987" height="1152" alt="image" src="https://github.com/user-attachments/assets/828cfbc0-cd42-48f7-aa51-da76972ea058" />

## Cloudflare-worker 部署
1. Workers:将`cloudflar_worker.js`代码粘贴到workers
2. KV：绑定一个KV（绑定名称即：`KV`）

## 添加账户
1. 复制Zeabur 账户的API KEY；
2. 服务面板上点击‘添加新账户’，粘贴API KEY，点击确定，自动更新数据到KV
