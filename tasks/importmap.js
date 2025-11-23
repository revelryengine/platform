/**
 * This script keeps the scopes in importmap.json and importmap.dev.json consistent.
 *
 * It reads the `./deps/` scope from `importmap.dev.json` and ensures that the same
 * mappings exist for the `https://cdn.jsdelivr.net/gh/revelryengine/deps/` scope in `importmap.json`.
 *
 * This script will become unnecessary once Deno supports multiple import maps natively.
 * https://github.com/denoland/deno/issues/30689
 *
 * To run this script, use the command: `deno task importmap:update`
 * To validate without making changes, use: `deno run -A ./tasks/importmap.js --validate`
 */

import { parseArgs } from "jsr:@std/cli@1.0.23/parse-args";

const { _: positionals } = parseArgs(Deno.args, {

});

async function run(validate = false) {
    const devImportMapPath  = new URL('../importmap.dev.json', import.meta.url);
    const prodImportMapPath = new URL('../importmap.json', import.meta.url);

    const devImportMap  = await Deno.readTextFile(devImportMapPath);
    const prodImportMap = await Deno.readTextFile(prodImportMapPath);

    // Extract the "./deps/" scope content from dev import map
    const devScopeMatch = devImportMap.match(/"\.\/deps\/"\s*:\s*\{([^}]+)\}/s);
    if (!devScopeMatch) {
        console.error('Could not find "./deps/" scope in importmap.dev.json');
        Deno.exit(1);
    }

    const devScopeContent = devScopeMatch[1];

    // Replace the production scope content while preserving formatting
    const updatedProdImportMap = prodImportMap.replace(
        /(["']https:\/\/cdn\.jsdelivr\.net\/gh\/revelryengine\/deps\/["']\s*:\s*\{)([^}]+)(\})/s,
        (_match, prefix, _oldContent, suffix) => {
            return prefix + devScopeContent + suffix;
        }
    );

    // Check if any changes were made
    if (updatedProdImportMap === prodImportMap) {
        console.log('No changes needed - scopes are already in sync');
    } else {
        if(validate) {
            console.error('Validation failed - scopes are not in sync');
            console.error('Please run the script with `update` to update the import map');
            Deno.exit(1);
        }
        // Write the updated production import map
        await Deno.writeTextFile(prodImportMapPath, updatedProdImportMap);
        console.log('Successfully synced scopes from importmap.dev.json to importmap.json');
    }
};

switch(positionals[0]) {
    case 'update':
        await run();
        break;
    case 'validate':
        await run(true);
        break;
    default:
        console.error('Subcommand must be one of: validate, update');
        Deno.exit(1);
}
