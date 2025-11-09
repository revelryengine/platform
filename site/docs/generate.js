import { parseArgs } from "jsr:@std/cli@1.0.23/parse-args";
import * as typedoc from 'npm:typedoc@0.28.14';
import { MarkdownPageEvent } from 'npm:typedoc-plugin-markdown@4.9.0';
import 'npm:typedoc-plugin-mdn-links@3.0.1';
import 'npm:typedoc-plugin-merge-modules@7.0.0';

const { pkg, validate } = parseArgs(Deno.args, {
    string: ["pkg"],
    boolean: ["validate"],
});

const packages = pkg ? [pkg] : ['utils', 'gltf'];

// const config = JSON.parse(await Deno.readTextFile('./deno.jsonc'));
const cwd = Deno.cwd();

const EXIT_FLAGS = {
    Ok:              0b0000,
    CompileError:    0b0001,
    ValidationError: 0b0010,
    UnknownError:    0b0100,
};

let exit = EXIT_FLAGS.Ok;

for(const pkg of packages) {
    console.log(`Generating docs for ${pkg}`);

    const pkgConfig = (await import(`../../packages/${pkg}/typedoc.config.js`)).default;

    if(!pkgConfig) {
        console.error(`No default export found in ./packages/${pkg}/typedoc.config.js`);
        Deno.exit(1);
    }

    Deno.chdir(cwd);
    Deno.chdir(`./packages/${pkg}`);

    const name = `revelryengine/${pkg}`;
    const root =  `../../site/docs/packages/${pkg}`;

    const app = await typedoc.Application.bootstrapWithPlugins({
        ...pkgConfig,
        name,
        basePath: './',
        readme: `./README.md`,

        compilerOptions: {
            checkJs: true,
            target: 'esnext',

            lib: ['esnext', 'dom', 'dom.iterable'],
            module: 'esnext',
            moduleResolution: 'node',
        },

        skipErrorChecking: true,
        validation: {
            notDocumented: true,
        },
        treatValidationWarningsAsErrors: true,
        out:    root,
        plugin: [
            'typedoc-plugin-merge-modules',
            'typedoc-plugin-markdown',
            'typedoc-plugin-mdn-links',
        ],
        requiredToBeDocumented: [
            'Module',
            "Enum",
            "EnumMember",
            "Variable",
            "Function",
            "Class",
            "Interface",
            "Constructor",
            "Property",
            "Method",
            "Parameter",
            "Accessor",
            "TypeParameter",
            "TypeAlias",
        ],
        mergeModulesMergeMode: 'module',
        mergeReadme: true,
        enumMembersFormat: 'htmlTable',
        parametersFormat: 'htmlTable',
        interfacePropertiesFormat: 'htmlTable',
        typeAliasPropertiesFormat: 'htmlTable',
        classPropertiesFormat: 'htmlTable',
        propertyMembersFormat: 'htmlTable',
        typeDeclarationFormat: 'htmlTable',
        indexFormat: 'table',
        expandParameters: true,
        expandObjects: true,
        hidePageHeader: true,
        navigationJson: `${root}/_navigation.json`,
        useFirstParagraphOfCommentAsSummary: true,

        externalSymbolLinkMappings: {
            "gl-matrix": {
                Mat4:     'https://glmatrix.net/docs/v4/types/Mat4.html',
                Quat:     'https://glmatrix.net/docs/v4/types/Quat.html',
                Vec2:     'https://glmatrix.net/docs/v4/types/Vec2.html',
                Vec3:     'https://glmatrix.net/docs/v4/types/Vec3.html',
                Vec4:     'https://glmatrix.net/docs/v4/types/Vec4.html',
                Mat4Like: 'https://glmatrix.net/docs/v4/types/Mat4Like.html',
                QuatLike: 'https://glmatrix.net/docs/v4/types/QuatLike.html',
                Vec2Like: 'https://glmatrix.net/docs/v4/types/Vec2Like.html',
                Vec3Like: 'https://glmatrix.net/docs/v4/types/Vec3Like.html',
                Vec4Like: 'https://glmatrix.net/docs/v4/types/Vec4Like.html',
            }
        }
    });

    app.renderer.on(MarkdownPageEvent.BEGIN, output => {
        if(output.model.name === name) { // Add extension to module file names
            // @ts-expect-error - Markdown plugin types are incorrect
            for (const child of output.model.children ?? []) {
                // Detect extension from source file
                const ext = child.sources?.[0]?.fileName?.endsWith('.d.ts') ? '.d.ts' : '.js';
                child.name = `${child.name}${ext}`;
            }
        }

        // @ts-expect-error - Markdown plugin types are incorrect
        if(output.model.typeParameters?.length === 0) {
            // @ts-expect-error - Markdown plugin types are incorrect
            output.model.typeParameters = undefined;
        }
    });

    app.renderer.on(MarkdownPageEvent.END, output => {
        // Add `<!-- {docsify-ignore} -->` to Modules section of main index page
        // @ts-expect-error - Markdown plugin types are incorrect
        if(output.model.kind === typedoc.ReflectionKind.Project) {
            output.contents = output.contents?.replace(/^(## Modules)$/m, '$1 <!-- {docsify-ignore} -->');
        }
        // Add `<!-- {docsify-ignore-all} -->` to the top of each module index file to prevent docsify from rendering the headers in the side bar
        // @ts-expect-error - Markdown plugin types are incorrect
        if(output.model.kind === typedoc.ReflectionKind.Module) {
            output.contents = output.contents?.replace((/^#(.*)$/m), '#$1 <!-- {docsify-ignore-all} -->');
        }

        //Inject import example on second line
        // @ts-expect-error - Markdown plugin types are incorrect
        if(output.model.kind !== typedoc.ReflectionKind.Project && output.model.kind !== typedoc.ReflectionKind.Module) {
            // @ts-expect-error - Markdown plugin types are incorrect
            if(output.model.kind === typedoc.ReflectionKind.TypeAlias || output.model.kind === typedoc.ReflectionKind.Interface) {
                // @ts-expect-error - Markdown plugin types are incorrect
                output.contents = output.contents?.replace(/\n\n/, `\n\n\`\`\`js\n\/\*\* @import { ${output.model.name} } from 'revelryengine/${pkg}/${output.model.parent.name}'; \*\/\n\`\`\`\n`);
            } else {
                // @ts-expect-error - Markdown plugin types are incorrect
                output.contents = output.contents?.replace(/\n\n/, `\n\n\`\`\`js\nimport { ${output.model.name} } from 'revelryengine/${pkg}/${output.model.parent.name}';\n\`\`\`\n`);
            }

        }

    });


    const project = await app.convert();

    if (project) {
        const warningCount = app.logger.warningCount;
        if(warningCount) {
            console.warn(`Project has ${warningCount} warnings`);
            exit |= EXIT_FLAGS.CompileError;
            continue;
        }
        app.validate(project);
        if(validate) {
            if (app.logger.warningCount > warningCount) {
                console.error(`Validation Failed with ${app.logger.warningCount - warningCount} warnings.`);
                exit |= EXIT_FLAGS.ValidationError;
            }
            continue;
        }

        // Generate configured outputs
        await app.generateOutputs(project);


        /**
         * @typedef {{ path: string, title: string, children?: NavigationEntry[], kind?: number }} NavigationEntry
         */

        const navigation = /** @type {NavigationEntry[]} */(JSON.parse(await Deno.readTextFile(`${root}/_navigation.json`)));
        const modules    = [];
        const search     = [...navigation];
        const paths      = [];

        while (search.length > 0) {
            const entry = search.shift();
            if(entry?.children) {
                search.push(...entry.children);
            }
            if(entry?.path && entry.path.endsWith('.md')) {
                paths.push(`/docs/packages/${pkg}/${entry.path}`);
            }
            if(entry?.kind === typedoc.ReflectionKind.Module) {
                modules.push(entry);
            }
        }

        // Create docsify plugin for indexing the docs pages
        await Deno.writeTextFile(`${root}/docsify-plugin.js`, /* javascript */`
            // @ts-nocheck - generated file
            globalThis.$docsify ??= {};
            $docsify.plugins = [(hook, vm) => {
                hook.init(() => {
                    vm.config.search ??= {};
                    vm.config.search.paths ??= [];
                    vm.config.search.paths.push(
                        '/docs/packages/${pkg}/README.md',
                        ${paths.map(path => `'${path}'`).join(',\n                        ')}
                    );

                    vm.config.alias ??= {};
                    Object.assign(vm.config.alias, {
                        ${[...new Set(paths.filter(path => !path.endsWith('README.md')).map(path => path.split('/').slice(0, -1).join('/')))].map(path => {
                            return `'${path}/_sidebar.md': '${path.split('/').slice(0, -1).join('/')}/_sidebar.md'`
                        }).join(',\n                        ')}
                    });
                });
            }, ...($docsify.plugins ?? [])]
        `);

        // Break modules down by sub folders
        const moduleGroups = Object.groupBy(modules, mod => {
            return mod.path.split('/').slice(0, -2).join('/');
        });

        // Generate _sidebar.md for pkg
        const content = [
            '- [Documentation](/docs/ ":class=no-chevron :class=non-collapsible")',
            `  - [revelryengine/${pkg}](/docs/packages/${pkg}/ ":class=no-chevron :class=non-collapsible")`,
            `    - [Modules](/docs/packages/${pkg}/?id=modules ":class=no-chevron :class=non-collapsible")`,
            ...Object.entries(moduleGroups).map(([folder, modules]) => {
                return [
                    `      - **${folder}**`,
                    ...modules?.map(entry => {
                        return `        - [${entry.path.split('/').at(-2)}](/docs/packages/${pkg}/${entry.path.replace('.md', '')})`;
                    }) ?? [],
                ]
            }).flat(),
            ,
        ].join('\n');
        await Deno.writeTextFile(`${root}/_sidebar.md`, content);

        // Generate _sidebar.md for each submodule
        for(const entry of modules) {
            const path = `${root}/${entry.path.replace('README.md', '_sidebar.md')}`;
            const entryPath = `/docs/packages/${pkg}/${entry.path.replace('.md', '')}`;
            const content = [
                '- [Documentation](/docs/ ":class=no-chevron :class=non-collapsible")',
                `  - [revelryengine/${pkg}](/docs/packages/${pkg}/ ":class=no-chevron :class=non-collapsible")`,
                `    - [Modules](/docs/packages/${pkg}/?id=modules ":class=no-chevron :class=non-collapsible")`,
                `      - [${entry.path.replace('/README.md', '')}](${entryPath} ":class=no-chevron :class=non-collapsible")`,
                ...entry.children?.map(child => {
                    return [
                        `        - [${child.title}](${entryPath}?id=${child.title.replace(/ /g, '-').toLowerCase()} ":class=no-chevron :class=non-collapsible")`,
                        ...child.children?.map(grandChild => {
                            const grandChildPath = grandChild.path.replace('.md', '');
                            return `          - [${grandChild.title}](/docs/packages/${pkg}/${grandChildPath})`;
                        }) ?? [],
                    ]
                }).flat() ?? [],
            ].join('\n');
            await Deno.writeTextFile(path, content);
        }

    } else {
        console.error('Failed to generate docs.');
        Deno.exit(EXIT_FLAGS.UnknownError);
    }
}

//Copy License and Notice to site
// Deno.chdir(cwd);
// await Deno.mkdir('./site/license');
// await Deno.copyFile('./LICENSE.md', './site/license/revelry.md')
// await Deno.copyFile('./NOTICE.md', './site/license/third-party.md')

Deno.exit(exit);
