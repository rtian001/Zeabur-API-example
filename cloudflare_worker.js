export default {
    async fetch(request, env, ctx) {
        const KV = env.KV;
        const isBoundKV = (typeof KV == 'undefined') ? false : true;
        var sourcedata='';
        var info={};
        if (isBoundKV) {
            sourcedata = await KV.get('zeabur')
            if (!sourcedata) {
                await KV.put('zeabur', '{}')
            }
            sourcedata = await KV.get('zeabur')
            info = JSON.parse(sourcedata)
        }
        const url = new URL(request.url);
        const pathname = url.pathname;
        const searchparams = url.searchParams
        const hostname = url.hostname;
        const path = pathname.split('/')[1]
        const account = pathname.split('/')[2] || ''
        //****从服务器更新数据 ;限定域名*/
        if (path == 'update') {
            const _info = JSON.parse(sourcedata)
            var token = searchparams.get('token') || ''
            let results = {}
            if (account in _info) {
                token = _info[account].token;
            }
            if (!!token) {
                results = await update_account(_info, token)
            } else if (account == 'all') {
                for (let _account in _info) {
                    let token = _info[_account].token;
                    let result = await update_account(_info, token)
                    results = Object.assign(results, result)
                }
            } else {
                let result = {}
                for (let _account in _info) {
                    result[_account] = { email: _info[_account].email, update: _info[_account].update }
                }
                results = { success: false, messages: result }
            }
            return Response.json(results)
        }
        //****前端请求的数据 */
        else if (path == 'zeabur.json') {
            let obj = {}
            for (let user in info) {
                obj[user] = info[user].regions
            }
            return Response.json(obj)
        }
        //****远程开机，停机 */
        else if (path == 'process') {
            let _info = JSON.parse(sourcedata)
            let services = generate_services(_info)
            let result = {}
            if (searchparams.size > 0) {
                let sid = searchparams.get('sid') || '';
                let cmd = searchparams.get('cmd') || '';
                if (sid in services) {
                    let s = services[sid]
                    let _token = s.token;
                    let _eid = s.environment_id;
                    let _sid = s.service_id
                    let _sinfo = _info[s.name].regions[s.region_idx].projects[s.project_idx].services[s.service_idx];
                    if (cmd.match(/start|stop/)) {
                        result = await process(_token, _eid, _sid, cmd)
                        if (result.success) {
                            let status=cmd=="stop"?'SUSPENDED':'RUNNING';
                            _sinfo.service_status=status;
                            _sinfo.service_suspendedAt=result.update;
                            result.data = _sinfo
                        }
                    } else {
                        result = { success: false, messages: _sinfo }
                    }

                } else {
                    result = { success: false, messages: { error: 'serviceID Error .' } }
                }
            } else {
                for (let service in services) {
                    delete services[service].token
                }
                result = { success: false, messages: services }
            }
            return Response.json(result)
        }
        //*****默认页面****** */
        else {
            let html = await KV.get('zeabur-html');
             if(!html){
                html=await fetch('https://s.128877.xyz/zeabur_api.html').then(res=>res.text())
            }
            return new Response(html, {
                headers: {
                    "content-type": "text/html;charset=utf-8"
                }
            });
        };
        //******API更新数据到KV****** */
        async function update_account(kv_data, token) {
            let result = await query_regions(token);
            if (!!result) {
                let _username = result.name;
                kv_data[_username] = result;
                await KV.put('zeabur', JSON.stringify(kv_data));
                return { success: true, messages: { account: _username, email: result.email, update: result.update } }
            } else {
                return { success: false, messages: 'token error.' }
            }
        }
    }//fetch
}//default

function getDateInTimezone(timezone) {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('zh-CN', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    return formatter.format(now);
}
//********************自定义API****************************************************** */
const api = 'https://api.zeabur.com/graphql';

// 主函数：根据token:API_KEY获取用户的所有区域、所有项目、所有服务
async function query_regions(token) {
    let query = { "query": "query{\n me {\n name\n email\n}\n projects(region: null) {\n edges {\n node {\n name\n _id\n region {\n name\n id\n }\n environments {\n _id\n}\n services {\n _id\n name\n createdAt\n status\n suspendedAt\n}\n}\n}\n}\n}" };
    let result = await fetch(api, {
        method: 'POST',
        headers: {
            "Authorization": `Bearer ${token}`,
            "content-type": "application/json"
        },
        body: JSON.stringify(query)
    }).then(res => res.json());
    if (result.data == null) return false;
    let results = format_data(result);
    results.token = token;
    return results;
}
// 主函数-辅助： 根据官方获取的数据整理符合自己需要的数据
function format_data(data) {
    let email = data.data.me.email;
    let name = data.data.me.name || email;
    let dtime = new Date().toISOString();
    let results = { name, email, token: '', update: dtime, regions: [] };
    let region_map = {};
    for (let item of data.data.projects.edges) {
        let project_name = item.node.name;
        let project_id = item.node._id;
        let environment_id = item.node.environments[0]._id;
        let region_name = item.node.region.name;
        let region_id = item.node.region.id;
        if (!region_map[region_id]) {
            region_map[region_id] = {
                region_name,
                region_id,
                projects: []
            };
        }
        let services = [];
        for (let service of item.node.services) {
            services.push({
                service_name: service.name,
                service_id: service._id,
                service_status: service.status,
                service_createdAt: service.createdAt,
                service_suspendedAt: service.suspendedAt
            });
        }
        region_map[region_id].projects.push({
            project_name,
            project_id,
            environment_id,
            services
        });
    }
    for (let region_id in region_map) {
        results.regions.push(region_map[region_id]);
    }
    return results;
}
// 生成所有服务索引数据
function generate_services(data) {
    let services = {};
    for (let username in data) {
        let token = data[username].token;
        for (let ri in data[username]['regions']) {
            let region = data[username]['regions'][ri]
            for (let pi in region.projects) {
                let project = region.projects[pi]
                for (let si in project.services) {
                    let service = project.services[si]
                    services[service.service_id] = {
                        name: username,
                        region_idx: ri,
                        project_idx: pi,
                        service_idx: si,
                        environment_id: project.environment_id,
                        service_id: service.service_id,
                        token,
                    };
                }
            }
        }
    }
    return services;
}

// 操作函数：服务的重启、挂起
async function process(token, envid, sid, command) {
    const _cmd = { 'start': 'restartService', 'stop': 'suspendService' }
    let data = {
        "query": `mutation{
          ${_cmd[command]}(serviceID: "${sid}", environmentID: "${envid}")
          }`
    }
    let res = await fetch(api, {
        method: 'POST',
        headers: {
            "Authorization": `Bearer ${token}`,
            "content-type": "application/json"
        },
        body: JSON.stringify(data)
    }).then(res => res.json());
    let results = { success: false, messages: res }
    if (!!res) {
        results.success = true
        results.update=command=='stop'?new Date().toISOString():null;
    }
    return results;
}//process

// 本地更新数据：直接更新KV数据（非api拉取数据），用于前端展示效果
// api更新请使用 /update
async function process_update(sid) {
    return 0
}

