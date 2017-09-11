const request = require('request-promise')
const {URLSearchParams} = require('url')

const {dd, snsExpire} = require('./config')
const accounts = require('./accounts')

const auth = async(ctx) => {
    console.log(`verify params: ${JSON.stringify(ctx.params)}`);

    // {
    //     "errcode": 0,
    //     "errmsg": "ok",
    //     "openid": "liSii8KCxxxxx",
    //     "persistent_code": "dsa-d-asdasdadHIBIinoninINIn-ssdasd",
    //     "unionid": "7Huu46kk"
    // }
    const persist = await request.post(
        `https://oapi.dingtalk.com/sns/get_persistent_code?access_token=` + dd.accessToken,
        {tmp_auth_code: ctx.params.code},
        {json: true}
    )

    // {
    //     "errcode": 0,
    //     "errmsg": "ok",
    //     "expires_in": 7200,
    //     "sns_token": "c76dsc87ds6c876sd87csdcxxxxx"
    // }
    const sns = await request.post(
        `https://oapi.dingtalk.com/sns/get_sns_token?access_token=` + dd.accessToken,
        {
            openid: persist.openid,
            persistent_code: persist.persistent_code
        },
        {json: true}
    )

    // {
    //     "errcode": 0,
    //     "errmsg": "ok",
    //     "user_info": {
    //         "maskedMobile": "130****1234",
    //         "nick": "张三",
    //         "openid": "liSii8KCxxxxx",
    //         "unionid": "7Huu46kk",
    //         "dingId": "dingId"
    //     }
    // }
    const userInfo = await request(
        `https://oapi.dingtalk.com/sns/getuserinfo?sns_token=` + sns.sns_token, {json: true})


    let pass = false
    for (let type in accounts) {
        if (accounts[type].includes(userInfo.dingId)) {
            // update cache
            const timestamp = Date.now()
            dd.snsCache = dd.snsCache || {vip: {}, active: {}}
            dd.snsCache[type] = dd.snsCache[type] || {}
            dd.snsCache[type][sns.sns_token] = timestamp
            console.log(dd.snsCache)

            pass = true

            //redirect
            const params = new URLSearchParams({sns: sns.sns_token, type})
            target.search = params.toString()
            ctx.redirect(target.href)
            break
        }
    }
    // TODO: homepage
    if (!pass) ctx.redirect('http://www.baidu.com');
}

const verify = async(ctx) => {
    // {sns, type}
    console.log(`verify params: ${JSON.stringify(ctx.params)}`)

    dd.snsCache = dd.snsCache || {vip: {}, active: {}}
    const cache = dd.snsCache[ctx.params.type] || {}
    for (let snsId in cache) {
        if (snsId == ctx.params.sns) {
            const timestamp = Date.now()
            if (timestamp - cache[snsId] <= snsExpire) {
                ctx.body = 'ok'
            } else {
                delete cache[snsId]
            }
            break
        }
    }

    // TODO: homepage
    if (ctx.body != 'ok')
        ctx.redirect('http://www.baidu.com')
}

module.exports = {
    auth, verify
}