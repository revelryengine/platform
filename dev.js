import { Application, Router, send } from 'https://deno.land/x/oak@v12.1.0/mod.ts';

const packages = new Router({ prefix: '/packages' });
const editor   = new Router({ prefix: '/editor' });
const router   = new Router();

const regex = /https\:\/\/cdn.jsdelivr.net\/gh\/revelryengine\/(.*?)@(.*?)\//g;
async function replaceImportMap(ctx, path) {
    let origin = ctx.request.url.origin;
    const forwardedProto = ctx.request.headers.get('x-forwarded-proto');
    if(forwardedProto) {
        origin = origin.replace(ctx.request.url.protocol, forwardedProto + ':');
    }
    ctx.response.status = 200;
    ctx.response.headers.set('Content-Type', 'text/javascript');
    ctx.response.body = (await Deno.readTextFile(path)).replaceAll(regex, (match, p1) => `${origin}/packages/${p1}/`);
}

packages.get('/(.*)', async (ctx, next) => {
    await send(ctx, ctx.request.url.pathname, { root: `${Deno.cwd()}` });
});

editor.get('/(.*)', async (ctx) => {
    if(ctx.request.url.pathname.endsWith('/importmap.js')) {
        await replaceImportMap(ctx, './editor/importmap.js')
    } else {
        await send(ctx, ctx.request.url.pathname.replace('/editor', ''), { root: `${Deno.cwd()}/editor`, index: 'index.html' });
    }
});

router.get('/(.*)', async (ctx) => {
    if(ctx.request.url.pathname.endsWith('/importmap.js')) {
        await replaceImportMap(ctx, './site/importmap.js')
    } else {
        await send(ctx, ctx.request.url.pathname, { root: `${Deno.cwd()}/site`, index: 'index.html' });
    }
});

const app = new Application({ logErrors: false });

app.use(async (context, next) => {
    await next();
    context.response.headers.set('Access-Control-Allow-Origin', '*');
    context.response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
    context.response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');

    console.log('%s - %s %s %s %s', 
        new Date().toISOString(),
        context.request.headers.get('X-Forwarded-For'),
        context.response.status,
        context.request.method,
        context.request.url.pathname,
    );
});

app.use(async (context, next) => {
    if(context.request.url.pathname.endsWith('/index.html')) {
        context.response.redirect(context.request.url.pathname.replace(/\/index.html$/, '/'));
    } else {
        await next();
    }
});

app.use(packages.routes());
app.use(packages.allowedMethods());

app.use(editor.routes());
app.use(editor.allowedMethods());

app.use(router.routes());
app.use(router.allowedMethods());

const port = Number(Deno.env.get('WEB_PORT')) || 8080;
console.log(`listening on port ${port}`);

await app.listen({ port });