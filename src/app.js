'use strict'

/** 
    启动微服务可能导致mysql连接数超限，如下设置MySQL最大连接数
    1、查看最大连接数
    show variables like '%max_connections%';
    2、修改最大连接数
    set GLOBAL max_connections = 200;
 */
const gateway = require('../index');
const { P2cBalancer } = require('load-balancers');
const service = require('restana')({});

const defaultTarget = 'http://localhost:3000';

/** target 改为 rest_service_name  */
const targets = [
    'http://172.18.254.95:7001',
    'http://172.18.254.95:7002',
    'http://172.18.254.95:7003',
    'http://172.18.254.95:7004',
    'http://172.18.254.95:7005',
    'http://172.18.254.95:7006',
    'http://172.18.254.95:7007',
    'http://172.18.254.95:7008',
    'http://172.18.254.95:7009',
    'http://172.18.254.95:7010',
    'http://172.18.1.50:7001',
    'http://172.18.1.50:7002',
    'http://172.18.1.50:7003',
    'http://172.18.1.50:7004',
    'http://172.18.1.50:7005',
    'http://172.18.1.50:7006',
    'http://172.18.1.50:7007',
    'http://172.18.1.50:7008',
    'http://172.18.1.50:7009',
    'http://172.18.1.50:7010',
];
const balancer = new P2cBalancer(targets.length);

// mock service
service.get('/**/*', (req, res) => res.send({ code: '099', err: 'token err.', success: false })).start(3000).then(() => console.log('Public service listening on 3000 port!'));

// gateway service
gateway({
    routes: [{
        proxyHandler: async(req, res, url, proxy, proxyOpts) => {

            // 根据rest_service_name，从注册服务获取对应API服务地址列表

            // 使用负载均衡算法，选取一个API服务地址，配置到proxy.Opts.base中

            // 对此API服务地址，就行健康检查(/_health)，如果不正常，则重新选取API服务地址，并将此API地址，从服务列表中移除。如果正常，则继续执行

            // 检查请求频率，如果过高，加入黑名单，黑名单失效后，移除黑名单

            console.log('api request url: ' + url);
            if (url && url.endsWith('hello') || false /** session or token 验证失效 */ ) {
                proxyOpts.base = defaultTarget;
            } else {
                proxyOpts.base = targets[balancer.pick()];
            }
            return proxy(req, res, url, proxyOpts);
            //return proxy(req, res, url, proxyOpts);
        },
        prefix: '/gateway',
    }]
}).start(3880).then(() => console.log('API Gateway Service Start !'));