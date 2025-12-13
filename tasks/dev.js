/**
 * Vitepress introduces a pretty cumbersome build step to our documentation site.
 * To make local development easier, we run a small server that serves lib, deps and samples files in front of vitepress's dev server.
 * The requests are then proxied to vitepress, which serves the actual documentation site.
 *
 * To run this server, use the command: `deno task dev:serve`
 */
import { Application, send } from 'jsr:@oak/oak@17.1.6';
import { parseArgs         } from 'jsr:@std/cli@1.0.23/parse-args';
import { debounce          } from "jsr:@std/async@1.0.15/debounce";

const { importMode = 'local', port = '8082', reload = false, _: positionals } = parseArgs(Deno.args, {
    string: ['port', 'importMode'],
    boolean: ['reload'],
});

async function cache() {
    console.log('Caching vendor types for deps, tasks, and test directories...');

    for(const dir of ['deps', 'tasks', 'test']) {
        const command = new Deno.Command(Deno.execPath(), {
            args: [
                'cache',
                '--allow-import',
                reload ? '--reload' : null,
                `./${dir}/*.js`,
            ].filter(a => a !== null),
            stdin: 'inherit',
            stdout: 'inherit',
        });

        const process = command.spawn();
        const status  = await process.status;
        if(!status.success) {
            Deno.exit(status.code);
        }
    }
}

async function serve() {
    const app = new Application({ logErrors: false });

    app.use(async (ctx) => {
        try {
            await send(ctx, ctx.request.url.pathname, { root: Deno.cwd() });
        } catch {
            ctx.response.status = 404;
        }
    });

    app.addEventListener('listen', async (event) => {
        console.log(`Serving static files on port ${event.port}`);

        /** @type {Deno.ChildProcess|null} */
        let process = null;

        const start = debounce(() => {
            if(process) {
                console.log(`Restarting Vitepress dev server...`);
                try {
                    process.kill('SIGTERM');
                } catch {
                    console.warn('Failed to kill previous Vitepress process');
                }

            } else {
                console.log(`Starting Vitepress dev server...`);
            }
            const command = new Deno.Command(Deno.execPath(), {
                args: [
                    'run',
                    '-A',
                    'npm:vitepress@next',
                    'dev',
                    'site',
                    `--port=${port}`,
                    `--proxy=http://localhost:${event.port}`,
                    `--importMode=${importMode}`,
                ],
                stdin: 'inherit',
                stdout: 'inherit',
            });

            process = command.spawn();
        }, 500);

        start();

        const watcher = Deno.watchFs([
            'site'
        ], { recursive: true });

        // vitepress creates a lot of file changes when running, so we ignore certain changes
        // .vitepress, .vitepress/cache, .vitepress/temp, .vitepress/config.js.timestamp*
        const ignoreRegexes = [/\.vitepress$/, /\.vitepress[\/\\](cache|temp)/, /\.timestamp-\d/];
        for await (const event of watcher) {
            if (event.kind === 'modify' || event.kind === 'create' || event.kind === 'remove') {
                if(event.paths.some(path => !ignoreRegexes.some(regex => regex.test(path)))) {
                    console.log(`File change detected (${event.paths.join(', ')}).`);
                    start();
                }
            }
        }
    });

    await app.listen({ port: 0 });
}

switch(positionals[0]) {
    case 'cache':
        await cache();
        break;
    case 'serve':
        await serve();
        break;
    default:
        console.error('Subcommand must be one of: cache, serve');
        Deno.exit(1);
}
