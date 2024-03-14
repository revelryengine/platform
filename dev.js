// @ts-nocheck

/**
 * Downloads all external imports into the ./vendor directory via the `deno vendor` command.
 * Creates symlinks for the packages
 * Start docker containers for site and editor
 */

import { expandGlobSync } from "https://deno.land/std@0.208.0/fs/mod.ts";
import * as path from "https://deno.land/std@0.208.0/path/mod.ts";

{ // deno types > lib.deno.d.ts
    console.log('%cGenerating lib.deno.d.ts...', 'color: #fdda0d')
    const cmd  = new Deno.Command(Deno.execPath(), { args: ['types'], stdout: 'piped' }).spawn();
    const file = await Deno.open('./lib.deno.d.ts', { create: true, write: true });
    cmd.stdout.pipeTo(file.writable);

    await cmd.status;
}

{ //deno vendor
    console.log('%cGenerating vendor folder for external dependencies...', 'color: #fdda0d');

    const files = [
        ...Array.from(expandGlobSync('**/deps/*.js')).map(file => file.path),
        ...Array.from(expandGlobSync('**/test/{**,.}/*.js')).map(file => file.path),
        'https://cdn.jsdelivr.net/gh/gpuweb/types/dist/index.d.ts',
        'https://cdn.jsdelivr.net/npm/@types/vscode/index.d.ts',
        'https://cdn.jsdelivr.net/npm/@types/vscode-webview/index.d.ts',
        'https://cdn.jsdelivr.net/npm/@types/sharedworker/index.d.ts',
        'https://deno.land/x/oak@v12.1.0/mod.ts',
    ]
    console.log(files);
    const args = ['vendor', '--force', '--no-config', '--import-map', './importmap.json', ...files];
    const cmd  = new Deno.Command(Deno.execPath(), { args, stdout: 'piped' }).spawn();
    cmd.stdout.pipeTo(Deno.stdout.writable, { preventClose: true });

    await cmd.status;
}

{
    console.log('%cCreating symlinks to @packages...', 'color: #fdda0d');

    const { imports } = JSON.parse(await Deno.readTextFile('./importmap.json'));

    await Deno.mkdir('./@packages', { recursive: true });

    for(const [url, dir] of Object.entries(imports)) {
        const src = path.join(Deno.cwd(), dir);
        const dst = url.replace('https://cdn.jsdelivr.net/gh/revelryengine', './@packages');

        try {
            await Deno.remove(dst);
        } catch {

        }

        await Deno.symlink(src, dst, { type: 'dir' });
    }
}

{
    console.log('%cStarting dev servers for site and editor in docker...', 'color: #fdda0d');
    const args = ['compose', 'up', '-d'];
    const cmd  = new Deno.Command('docker', { args, stdout: 'piped' }).spawn();
    cmd.stdout.pipeTo(Deno.stdout.writable, { preventClose: true });

    await cmd.status;

    console.log('%cOpen demo site at http://localhost:8082', 'color: green')
    console.log('%cOpen editor at http://localhost:8084', 'color: green')
}
