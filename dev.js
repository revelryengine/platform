import { Application, send } from 'https://deno.land/x/oak/mod.ts';

const app = new Application();

app.use(async (context) => {
    console.log(context.request.url.pathname);

    if(context.request.url.pathname.endsWith('/importmap.js')) {
        context.response.status = 200;
        context.response.headers.set('Content-Type', 'text/javascript');
        context.response.body   = (await Deno.readTextFile('./site/importmap.js')).replaceAll('https://cdn.jsdelivr.net/gh/revelryengine/', '/packages/');
        return;
    }

    if(context.request.url.pathname.endsWith('/index.html')) {
        return context.response.redirect(context.request.url.pathname.replace(/\/index.html$/, '/'));
    }

    const pattern = new URLPattern({ pathname: `/packages/*` });
    if(pattern.test(context.request.url)) {
        await send(context, context.request.url.pathname, {
            root: `${Deno.cwd()}`
        });
    }

    if(context.response.status === 404) {
        await send(context, context.request.url.pathname, {
            root: `${Deno.cwd()}/site`,
            index: 'index.html',
        });
    }

    context.response.headers.set('Access-Control-Allow-Origin', '*');
});

const port = Number(Deno.env.get('WEB_PORT')) || 8080;
console.log(`listening on port ${port}`);

await app.listen({ port });