import { Application, send } from 'https://deno.land/x/oak/mod.ts';

const app = new Application();

app.use(async (context) => {
    console.log(context.request.url.pathname);

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
            root: `${Deno.cwd()}/site`
        });
    }

    if(context.response.status === 404) {
        context.response.status = 200;
        context.response.body = (await Deno.readTextFile('./site/index.html')).replace('<!-- {dev import map} -->', `
        <!-- We can remove this shim once all major browsers support import maps -->
        <script async src="https://ga.jspm.io/npm:es-module-shims@1.3.6/dist/es-module-shims.js"></script>
        <script type="importmap-shim">
            {
                "imports": {
                    "https://cdn.jsdelivr.net/gh/revelryengine/": "/packages/"
                }
            }
        </script>`).replaceAll('<script type="module"', '<script type="module-shim"');
    }

    context.response.headers.set('Access-Control-Allow-Origin', '*');
});

const port = Number(Deno.env.get('WEB_PORT')) || 8080;
console.log(`listening on port ${port}`);

await app.listen({ port });