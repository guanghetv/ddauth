const Koa = require('koa')
const app = new Koa()
const router = require('koa-router')()

const URL = require('./config').URL

router
    .get('/', async ctx => {
        ctx.body = 'Hello World!'
    })
    .get('/token/:type/:id', async ctx => {
        // TODO:
        if (ctx.params.type == 'ok')
            ctx.body = 'ok';
        else
            ctx.throw(401);
    })
    .get('/callback', function *(next) {
        ctx.body = 'callback'
    })
    .put('/users/:id', function *(next) {
        // ...
    })
    .del('/users/:id', function *(next) {
        // ...
    })

app
    .use(router.routes())
    .use(router.allowedMethods())

// console.log(URL.port)
app.listen(URL.port)
