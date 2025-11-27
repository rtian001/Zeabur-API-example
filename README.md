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

-------
# Zeabur-API
zeabur API 操作实例
> 官方文档： https://zeabur.com/docs/zh-CN/developer/public-api
>
> GraphQL API ：https://studio.apollographql.com/public/zeabur/variant/main/explorer
## API使用技巧
1. 登录zeabur
2. 使用官方文档中的链接打开或直接打开GraphQL API；默认加载api密钥
3. 从API Development文档选择要进行的操作：query 或 mutation，并配置相关选项
4. 执行
5. 浏览器-开发者工具-网络；查看`graphql`请求信息；复制请求字符串[data需要的内容]

## API密钥
```
#示例token
sk-gx20c4k****qpk4z
```
### 1. 获取区域
> 命令
```bash
curl --request POST \
  --url https://api.zeabur.com/graphql \
  --header 'Authorization: Bearer sk-gx20c4k****qpk4z' \
  --header 'Content-Type: application/json' \
  --data '{"query":"query{\n regions {\n name\n id\n}\n}\n"}'
```
> 结果
```json
{
  "data": {
    "regions": [
      {
        "name": "Hong Kong",
        "id": "hkg1"
      },
      {
        "name": "Tokyo, Japan",
        "id": "hnd1"
      },
      {
        "name": "Frankfurt, Germany",
        "id": "fra1"
      },
      {
        "name": "Taipei, Taiwan",
        "id": "tpe0"
      },
      {
        "name": "Taipei, Taiwan",
        "id": "tpe1"
      },
      {
        "name": "Jakarta, Indonesia",
        "id": "cgk1"
      },
      {
        "name": "Silicon Valley, United States",
        "id": "sjc1"
      },
      {
        "name": "California, United States",
        "id": "sfo1"
      },
      {
        "name": "Shanghai, China",
        "id": "sha1"
      }
    ]
  }
}
```
> 目前免费层可用的区域[2025-10]
```json
[
  {
    "name": "Silicon Valley, United States",
    "id": "sjc1"
  },
  {
    "name": "Jakarta, Indonesia",
    "id": "cgk1"
  }
]
```
### 2. 根据区域[id]获取该区域下的项目和服务
> 命令
```bash
curl --request POST \
  --url https://api.zeabur.com/graphql \
  --header 'Authorization: Bearer sk-gx20c4k****qpk4z' \
  --header 'Content-Type: application/json' \
  --data '{"query":"query{\n  projects(region: \"sjc1\") {\n edges {\n node {\n name\n _id\n environments {\n _id\n}\n services {\n name\n _id\n}\n}\n}\n}\n}\n"}'
```
> javascript
```javascript
const api='https://api.zeabur.com/graphql'
async function query_regions(token,regionID) {
  let data = { "query": `query{\n  projects(region: \"${regionID}\") {\n edges {\n node {\n name\n _id\n environments {\n _id\n}\n services {\n name\n _id\n}\n}\n}\n}\n}`}
  let res = await fetch(api, {
    method: 'POST',
    headers: {
      "Authorization": `Bearer ${token}`,
      "content-type": "application/json"
    },
    body: JSON.stringify(data)
  }).then(res => res.json())
  return res
}
```
> 结果: 包含常用的projectID，environmentID,serviceID
```json
{
  "data": {
    "projects": {
      "edges": [
        {
          "node": {
            "name": "nginx",
            "_id": "68ef0014a2*****97899e638",
            "environments": [
              {
                "_id": "68ef001*****ab999f05f2d1"
              }
            ],
            "services": [
              {
                "name": "nginx",
                "_id": "68ef0014*****597899e639"
              },
              {
                "name": "v2ray",
                "_id": "68ef16b14*****10da4d5a7e"
              },
              {
                "name": "sing-box",
                "_id": "68ef5fdf46*****10da4d6812"
              }
            ]
          }
        },
        {
          "node": {
            "name": "jupyterlab",
            "_id": "690ae4b5c4*****43e2b805f",
            "environments": [
              {
                "_id": "690ae4b5*****71f1baa22cf"
              }
            ],
            "services": [
              {
                "name": "JupyterLab",
                "_id": "690ae4b6*****ef43e2b8060"
              }
            ]
          }
        },
        {
          "node": {
            "name": "material-for-mkdocs",
            "_id": "691576bad7*****71da270e9",
            "environments": [
              {
                "_id": "691576ba*****fb3e1248a19"
              }
            ],
            "services": [
              {
                "name": "mkdocs",
                "_id": "691576bad*****f71da270ea"
              }
            ]
          }
        }
      ]
    }
  }
}
```
### 3. 重启服务
> 命令
```bash
curl --request POST \
  --url https://api.zeabur.com/graphql \
  --header 'Authorization: Bearer sk-gx20c4k****qpk4z' \
  --header 'Content-Type: application/json' \
  --data '{"query":"mutation{\n restartService(serviceID: \"691576bad*****f71da270ea\", environmentID: \"691576ba*****fb3e1248a19\")\n}\n"}'
```
> 结果
```json
{
  "data": {
    "restartService": true
  }
}
```

### 4. 停止服务
> 命令
```
curl --request POST \
  --url https://api.zeabur.com/graphql \
  --header 'Authorization: Bearer sk-gx20c4k****qpk4z' \
  --header 'Content-Type: application/json' \
  --data '{"query":"mutation{\n suspendService(serviceID: \"691576bad*****f71da270ea\", environmentID: \"691576ba*****fb3e1248a19\")\n}\n"}'
```
