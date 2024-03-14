import { Application, Router, send } from 'https://deno.land/x/oak@v12.1.0/mod.ts';

function getNonce() {
	return [...crypto.getRandomValues(new Uint8Array(16))].map(b => b.toString(16).padStart(2, '0')).join('');
}

const router   = new Router();

/**
 * @param {import('https://deno.land/x/oak@v12.1.0/mod.ts').Context} ctx
 * @param {string} path
 */
async function replaceImportMap(ctx, path) {
    ctx.response.status = 200;
    ctx.response.headers.set('Content-Type', 'text/javascript');
    ctx.response.body = await Deno.readTextFile(path);
}

/**
 * @param {import('https://deno.land/x/oak@v12.1.0/mod.ts').Context} ctx
 * @param {string} path
 */
async function replaceIndexNonce(ctx, path) {
    ctx.response.status = 200;
    ctx.response.headers.set('Content-Type', 'text/html');
    ctx.response.body = (await Deno.readTextFile(path)).replaceAll(/\$\{nonce\}/g, getNonce());
}

router.get('/(.*)', async (ctx) => {
    const { pathname } = ctx.request.url;

    if(ctx.request.url.pathname.endsWith('/importmap.js')) {
        await replaceImportMap(ctx, './importmap.js')
    } else if(pathname.startsWith('/@packages/')) {
        await send(ctx, ctx.request.url.pathname.replace(/\/@packages\/(.*?)@.*?\//, '/packages/$1/'), { root: `${Deno.cwd()}/../`, index: 'index.html' });
    } else if(ctx.request.url.pathname.endsWith('/')) {
        await replaceIndexNonce(ctx, `${Deno.cwd()}${ctx.request.url.pathname}index.html`);
    } else {
        await send(ctx, ctx.request.url.pathname, { root: `${Deno.cwd()}`, index: 'index.html' });
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

app.use(router.routes());
app.use(router.allowedMethods());

const port = Number(Deno.env.get('WEB_PORT')) || 8080;
console.log(`listening on port ${port}`);

await app.listen({ port });
