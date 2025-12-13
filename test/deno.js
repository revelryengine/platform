/**
 * @param {{ pkg?: string, coverage?: boolean, debug?: boolean }} options
 */
export async function runTests({ pkg, coverage, debug }) {
    console.log(`Running Deno tests for: ${pkg ?? 'all packages'}`);

    const config = {
        groups: [
            {
                name: 'utils',
                files: [
                    'packages/utils/**/__tests__/**/*.test.js'
                ]
            },
            {
                name: 'ecs',
                files: [
                    'packages/ecs/**/__tests__/**/*.test.js'
                ]
            },
            {
                name: 'gltf',
                files: [
                    'packages/gltf/**/__tests__/**/*.test.js'
                ]
            }
        ],
        debug,
        coverage,
        coverageConfig: {
            reportDir: 'coverage/deno',
            exclude: [`test/`, `__tests__/`, `deps/`],
        },
    };

    const include = [];

    for (const groupConfig of (pkg ? config.groups.filter(g => g.name === pkg) : config.groups)) {
        include.push(...(groupConfig.files ?? []));
    }

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
            ...include,
        ],
        stdout: 'inherit',
        stderr: 'inherit',
    }).spawn();

    const result = await command.output();

    if(config.coverage && !debug) {
        // Generate LCOV using Deno's built-in coverage tool
        console.log('Generating Deno coverage report...');
        const lcovCmd = new Deno.Command(Deno.execPath(), {
            args: [
                'coverage', config.coverageConfig.reportDir,
                '--lcov',
                `--output=${config.coverageConfig.reportDir}/lcov.info`,
                ...config.coverageConfig.exclude.map(pattern =>`--exclude=${pattern}`)
            ].filter(Boolean),
            stdout: 'inherit',
            stderr: 'inherit',
        }).spawn();

        await lcovCmd.output();

        const htmlCmd = new Deno.Command(Deno.execPath(), {
            args: [
                'coverage', config.coverageConfig.reportDir,
                '--html',
                ...config.coverageConfig.exclude.map(pattern =>`--exclude=${pattern}`)
            ].filter(Boolean),
            stdout: 'inherit',
            stderr: 'inherit',
        }).spawn();

        await htmlCmd.output();

        // Update lcov paths to be relative
        const lcovPath = `${config.coverageConfig.reportDir}/lcov.info`;
        const lcovData = await Deno.readTextFile(lcovPath);
        await Deno.writeTextFile(lcovPath, lcovData.replaceAll(Deno.cwd() + '\\', ''));
    }

    return result.success;
}

