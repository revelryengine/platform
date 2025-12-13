import { startTestRunner, summaryReporter } from 'npm:@web/test-runner@0.20.2';
import { importMapsPlugin   } from 'npm:@web/dev-server-import-maps@0.2.1';
import { playwrightLauncher } from 'npm:@web/test-runner-playwright@0.11.1';

import importmap from '../importmap.dev.json' with { type: 'json' };

/**
 * @import { TestRunnerConfig } from 'npm:@web/test-runner@0.20.2';
 */

/**
 * @param {{ pkg?: string, coverage?: boolean, debug?: boolean }} options
 */
export async function runTests({ pkg, coverage, debug }) {
    console.log(`Running Browser tests for: ${pkg ?? 'all packages'}`);

    // install browsers
    const command = new Deno.Command(Deno.execPath(), {
        args: ['run', '-A', 'npm:playwright@1.53.0', 'install', 'chromium', 'firefox'],
        stdout: 'inherit',
        stderr: 'inherit',
    }).spawn();

    await command.output();

    /** @type {Partial<TestRunnerConfig>} */
    const config = {
        manual: debug,
        open: debug,
        groups: [
            {
                name: 'utils',
                files: [
                    `packages/utils/**/__tests__/**/*.test.js`
                ],
                browsers: [
                    playwrightLauncher({ product: 'chromium' }),
                    playwrightLauncher({ product: 'firefox'  }),
                ],
            },
            {
                name: 'ecs',
                files: [
                    `packages/ecs/**/__tests__/**/*.test.js`
                ],
                browsers: [
                    playwrightLauncher({ product: 'chromium' }),
                    playwrightLauncher({ product: 'firefox'  }),
                ],
            },
            {
                name: 'gltf',
                files: [
                    `packages/gltf/**/__tests__/**/*.test.js`
                ],
                browsers: [
                    playwrightLauncher({ product: 'chromium' }),
                    playwrightLauncher({ product: 'firefox'  }),
                ],
            }
        ],
        plugins: [
            importMapsPlugin({ inject: { importMap: importmap } }),
        ],
        coverage,
        coverageConfig: {
            report: true,
            reportDir: 'coverage/browser',
            exclude: ['test/**', '**/__tests__/**', '**/deps/**'],
        },
        reporters: [
            summaryReporter({})
        ],
    };

    const runner = await startTestRunner({ config, argv: pkg ? ['--group', pkg] : [], autoExitProcess: false });

    await new Promise((resolve) => {
        runner?.on('stopped', resolve);
    });

    return runner?.passed ?? false;
}




