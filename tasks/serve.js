import { Application, Router, send } from 'https://deno.land/x/oak@v12.1.0/mod.ts';

const router = new Router();

router.get('/importmap.js', async (ctx) => {
    const contents = await Deno.readTextFile('./site/importmap.js');
    ctx.response.headers.set('Content-Type', 'application/javascript');
    ctx.response.body = `globalThis.REVELRY_IMPORT_MODE = new URL(self.location.href).searchParams?.has('FORCE_REMOTE_CDN') ? 'remote' : 'local';\n${contents}`;
});

router.get('/(.*)', async (ctx) => {
    let path = ctx.request.url.pathname;
    if(!path.startsWith('/packages') && !path.startsWith('/samples')) {
        path = `/site${path}`;
    }

    await send(ctx, path, { root: Deno.cwd(), index: 'index.html' });
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
