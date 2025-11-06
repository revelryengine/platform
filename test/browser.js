import { parseArgs } from "jsr:@std/cli@1.0.23/parse-args";

import { startTestRunner, summaryReporter } from 'npm:@web/test-runner@0.20.2';
import { importMapsPlugin   } from 'npm:@web/dev-server-import-maps@0.2.1';
import { playwrightLauncher } from 'npm:@web/test-runner-playwright@0.11.1';

import importmap from '../importmap.dev.json' with { type: 'json' };

const { debug, coverage, pkg } = parseArgs(Deno.args, {
    boolean: ["debug", "coverage"],
    string: ["pkg"],
});

console.log('Running browser tests for package:', pkg ? pkg : 'all packages');

/**
 * @import { TestRunnerConfig } from 'npm:@web/test-runner@0.20.2';
 */

/** @type {Partial<TestRunnerConfig>} */
const config = {
    manual: debug,
    open: debug,
    groups: [
        {
            name: 'utils',
            files: [
                `packages/utils/test/**/*.test.js`,
                `!packages/utils/test/**/*.deno.test.js`
            ],
            browsers: [
                playwrightLauncher({ product: 'chromium' }),
                playwrightLauncher({ product: 'firefox'  }),
            ],
        },
        {
            name: 'ecs',
            files: [
                `packages/ecs/test/**/*.test.js`,
                `!packages/ecs/test/**/*.deno.test.js`
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
        reportDir: 'coverage/browser',
        include: [`**/lib/**`],
    },
    reporters: [
        summaryReporter({})
    ],
};

await startTestRunner({ config, argv: pkg ? ['--group', pkg] : [], autoExitProcess: false });
