import { parseArgs            } from 'jsr:@std/cli@1.0.23/parse-args';
import { parse, format, merge } from 'npm:lcov-utils@0.5.4';
import { generateReport       } from 'npm:lcoview@1.1.1';

const { pkg, env, coverage, debug } = parseArgs(Deno.args, {
    boolean: ["coverage", "debug"],
    string: ["pkg", "env"],
});

const PACKAGES = ['utils', 'gltf'];
const ENVS = ['browser', 'deno'];

if (pkg && !PACKAGES.includes(pkg)) {
    console.error(`Unknown package: ${pkg}`);
    Deno.exit(1);
}

if (env && !ENVS.includes(env)) {
    console.error(`Unknown environment: ${env}`);
    Deno.exit(1);
}

if(coverage) {
    await Deno.remove('coverage', { recursive: true }).catch(() => {});
}

let failed = false;
for (const envName of (env ? [env] : ENVS)) {
    const runTestsModule = await import(`../test/${envName}.js`);
    if(!(await runTestsModule.runTests({ pkg, coverage, debug }))){
        failed = true;
    }
};

if(coverage) {
    const denoLcov    = parse(await Deno.readTextFile('coverage/deno/lcov.info').catch(() => ''));
    const browserLcov = parse(await Deno.readTextFile('coverage/browser/lcov.info').catch(() => ''));
    const mergedLcov  = format(merge(denoLcov, browserLcov));

    // Write merged lcov file
    await Deno.writeTextFile('coverage/lcov.info', mergedLcov);

    const indexPath = await generateReport({
        lcovFilePath: 'coverage/lcov.info',
        destDir: './coverage/html',
        quiet: false
    });

    console.log(`Combine Coverage Report generated at: ${indexPath}`)
}

if(failed) {
    console.error('%cSome tests failed!', 'color: red;');
    Deno.exit(1);
} else {
    console.log('%cAll tests passed!', 'color: green;');
}

