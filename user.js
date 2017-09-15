const request = require('request-promise')
const {URLSearchParams} = require('url')
const {dd, target, snsExpire} = require('./config')
const accounts = require('./accounts')

const requestUserInfo = async(ctx) => {
    // console.log(ctx.request.query)

    // {
    //     "errcode": 0,
    //     "errmsg": "ok",
    //     "openid": "liSii8KCxxxxx",
    //     "persistent_code": "dsa-d-asdasdadHIBIinoninINIn-ssdasd",
    //     "unionid": "7Huu46kk"
    // }
    const persist = await request(
        {
            method: 'POST',
            uri: `https://oapi.dingtalk.com/sns/get_persistent_code?access_token=` + dd.accessToken,
            body: {tmp_auth_code: ctx.request.query.code},
            json: true
        }
    )
    if (persist.errcode) {
        console.error(persist.errmsg)
        return null;
    }


    // {
    //     "errcode": 0,
    //     "errmsg": "ok",
    //     "expires_in": 7200,
    //     "sns_token": "c76dsc87ds6c876sd87csdcxxxxx"
    // }
    const sns = await request(
        {
            method: 'POST',
            uri: `https://oapi.dingtalk.com/sns/get_sns_token?access_token=` + dd.accessToken,
            body: {
                openid: persist.openid,
                persistent_code: persist.persistent_code
            },
            json: true
        }
    );
    if (sns.errcode) {
        console.error(sns.errmsg)
        return null;
    }

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
    if (userInfo.errcode) {
        console.error(sns.errmsg)
        return null;
    } else {
        userInfo.sns = sns
        console.info(`userInfo:${JSON.stringify(userInfo)}`)
        return userInfo
    }

}

const auth = async(ctx) => {
    // console.log(ctx.request.query)

    // http://127.0.0.1:10010/redirect?code=8376b783ae023efeb73181c7a98e85fc&state=STATE

    // console.log(ctx.request.header)
    let userInfo = requestUserInfo(ctx)
    // TODO: refer 鉴权
    // if(ctx.request.header.referrer == ''){
    //     userInfo = requestUserInfo(ctx)
    // }

    let pass = false

    // TEST
    // let userInfo = {
    //     "errcode": 0,
    //     "errmsg": "ok",
    //     "user_info": {
    //         "nick": "李诺",
    //         "unionid": "jiiH19BujV6ciE",
    //         "dingId": "$:LWCP_v1:$RY0eN+V7dh9NpfeVRvVgWQ==",
    //         "openid": "PpmYpdLxNksiE"
    //     },
    //     "sns": {"errcode": 0, "errmsg": "ok", "sns_token": "9259703991283ecd89d6232d6f6a32b0", "expires_in": 7200}
    // }

    for (let type in accounts) {
        if (accounts[type].includes(userInfo.user_info.dingId)) {
            // init cache
            dd.snsCache = dd.snsCache || {vip: {}, active: {}}
            dd.snsCache[type] = dd.snsCache[type] || {}

            // update
            const timestamp = Date.now()
            dd.snsCache[type][userInfo.sns.sns_token] = timestamp
            console.log(dd.snsCache)

            pass = true

            //redirect
            ctx.response.set('sns', userInfo.sns.sns_token)
            ctx.response.set('type', type)
            ctx.redirect(target.href)
            break
        }
    }

    if (!pass) ctx.redirect(dd.loginUrl);
}

const verify = async(ctx) => {
    // {sns, type}
    console.log(`verify params: ${JSON.stringify(ctx.params)}`)

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

    if (ctx.body != 'ok') {
        ctx.body = 'Unauthorized'
        ctx.status = 401;
    }
}

module.exports = {
    auth, verify
}