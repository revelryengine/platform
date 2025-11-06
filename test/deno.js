import { parseArgs } from "jsr:@std/cli@1.0.23/parse-args";

const { pkg, debug, coverage } = parseArgs(Deno.args, {
    boolean: ["debug", "coverage"],
    string: ["pkg"],
});

const config = {
    groups: [
        {
            name: 'utils',
            files: [
                'packages/utils/test/**/*.test.js',
                `!packages/utils/test/**/*.browser.test.js`
            ]
        },
        {
            name: 'ecs',
            files: [
                'packages/ecs/test/**/*.test.js',
                `!packages/ecs/test/**/*.browser.test.js`
            ]
        }
    ],
    debug,
    coverage,
    coverageConfig: {
        reportDir: 'coverage/deno',
        include: [`**/lib/**`],
    },
};

await (async () => {
    const include = [];
    const ignore = [];

    for (const groupConfig of (pkg ? config.groups.filter(g => g.name === pkg) : config.groups)) {
        for(const filePattern of groupConfig.files ?? []) {
            if (filePattern.startsWith('!')) {
                ignore.push(filePattern.slice(1));
            } else {
                include.push(filePattern);
            }
        }
    }
    console.log(`Running Deno tests for group: ${pkg ?? 'all groups'}`);

    const command = new Deno.Command(Deno.execPath(), {
        args: [
            'test', '-A',
            '--location', 'http://revelry.local',
            '--trace-leaks',
            '--no-check',
            ...[
                debug ? '--inspect' : '',
                debug ? '--inspect-wait' : '',
                !debug ? `--coverage=${config.coverageConfig.reportDir}` : '',
                !debug ? '--coverage-raw-data-only': ''
            ].filter(Boolean),
            ...ignore.map(pattern => `--ignore=${pattern}`),
            ...include,
        ],
        stdout: "inherit",
        stderr: "inherit"
    }).spawn();

    await command.output();

    //deno coverage coverage/deno --exclude=deps --exclude=test",
})();

