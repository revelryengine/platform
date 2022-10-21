import { Application, send } from 'https://deno.land/x/oak/mod.ts';

const app = new Application({ logErrors: false });

app.use(async (context, next) => {
    await next();
    context.response.headers.set('Access-Control-Allow-Origin', '*');
    console.log('%s - %s %s %s %s', 
        new Date().toISOString(),
        context.request.headers.get('X-Forwarded-For'),
        context.response.status,
        context.request.method,
        context.request.url.pathname,
    );
});

app.use(async (context, next) => {
    if(context.request.url.pathname.endsWith('/importmap.js')) {
        context.response.status = 200;
        context.response.headers.set('Content-Type', 'text/javascript');
        context.response.body   = (await Deno.readTextFile('./site/importmap.js')).replaceAll('https://cdn.jsdelivr.net/gh/revelryengine/', '/packages/');
    } else {
        await next();
    }
});

app.use(async (context, next) => {
    if(context.request.url.pathname.endsWith('/index.html')) {
        context.response.redirect(context.request.url.pathname.replace(/\/index.html$/, '/'));
    } else {
        await next();
    }
});

app.use(async (context, next) => {
    const pattern = new URLPattern({ pathname: `/packages/*` });
    if(pattern.test(context.request.url)) {
        try {
            await send(context, context.request.url.pathname, {
                root: `${Deno.cwd()}`
            });
        } catch(e) {
            await next();
        }
    } else {
        await next();
    }
});

app.use(async (context) => {
    try {
        await send(context, context.request.url.pathname, {
            root: `${Deno.cwd()}/site`,
            index: 'index.html',
        });
    } catch(e) {
        
    }
});

const port = Number(Deno.env.get('WEB_PORT')) || 8080;
console.log(`listening on port ${port}`);

await app.listen({ port });