const request = require('request-promise')
const {url, delay, dd} = require('./config')

function send() {
    // 发送更新钉钉服务器token的请求
    console.log(`http://127.0.0.1:${url.port}/accessToken/update`)
    request.post(`http://127.0.0.1:${url.port}/accessToken/update`)
}

async function update(ctx) {
    const response = await request(`https://oapi.dingtalk.com/sns/gettoken?appid=${dd.appId}&appsecret=${dd.appSecret}`,
        {json: true})
    dd.accessToken = response.access_token
    console.log(`accessToken:${dd.accessToken}`)
    ctx.body = 'ok'
}

function cron() {
    send()
    setInterval(send, delay)
}

module.exports = {
    cron, update
}