/**
 * Generates documentation for the revelryengine packages using TypeDoc and the typedoc-plugin-markdown plugin.
 *
 * The generated markdown files are placed in the `site/reference/lib/` directory, organized by package.
 *
 * ## Custom Modifications to TypeDoc Output
 *
 * This script applies several transformations to the default TypeDoc markdown output to better suit
 * the Revelry Engine documentation workflow and ESM import conventions:
 *
 * ### During MarkdownPageEvent.BEGIN (Pre-generation):
 * - **Import examples injection**: Prepends import/import-type examples to each symbol's documentation
 *   - TypeAlias/Interface: Adds JSDoc `@import` syntax
 *   - Class/Variable/Function: Adds standard ESM `import` syntax
 *   - Handles both standard (`revelryengine/pkg/module.js`) and virtual module specifiers
 * - **Type parameter cleanup**: Removes empty `typeParameters` arrays from reflections
 * - **Relative link resolution**: Converts TypeDoc relative-link AST nodes to absolute `/reference/lib/` paths
 *   - Resolves file URLs relative to source files
 *   - Transforms `__docs__` paths to `docs` and `README.md` to `/`
 *
 * ### During MarkdownPageEvent.END (Post-generation):
 * - **Source link transformation**: Changes "Defined in: [text](link)" to "[View Source](link)"
 * - **Node modules filtering**: Strips out unwanted "Defined in: ../node_modules/..." references
 * - **Long path word breaking**: Adds `<wbr>` tags after slashes in heading paths for better line wrapping
 * - **Table styling**: Adds `class="desc"` to Description table headers for custom CSS styling
 *
 * ### Post-generation file operations:
 * - **README/docs copying**: Copies package `README.md` and `__docs__/` folders to output directory
 *   - Transforms `__docs__` → `docs` and `README.md` → `index.md` in paths
 *   - Replaces internal markdown links (`/__docs__/`, `/README.md`) in content
 * - **Sidebar enhancement**: Modifies `typedoc-sidebar.json` to add package index links and sort entries
 *   - Folders appear before files, then alphabetically sorted
 * - **Cleanup**: Removes TypeDoc-generated `_media` folder
 *
 * ## Usage
 * - `deno task docs:validate` - Validate the docs without generating
 * - `deno task docs:generate` - Generate docs without validation
 * - `deno task docs:build` - Build VitePress site from generated docs
 * - Use `--pkg=<name>` to generate docs for a specific package only
 */

import { parseArgs  } from 'jsr:@std/cli@1.0.23/parse-args';
import { expandGlob } from 'jsr:@std/fs@1.0.19/expand-glob';
import * as Path from 'jsr:@std/path@1.1.2';
import * as Posix from 'jsr:@std/path@1.1.2/posix';

import * as typedoc from 'npm:typedoc@0.28.14';
import { MarkdownPageEvent } from 'npm:typedoc-plugin-markdown@4.9.0';
import 'npm:typedoc-plugin-mdn-links@5.0.10';
import 'npm:typedoc-plugin-merge-modules@7.0.0';
import 'npm:typedoc-vitepress-theme@1.1.2';

/**
 * @import { TypeDocOptions, DeclarationReflection } from 'npm:typedoc@0.28.14';
 * @import { PluginOptions } from 'npm:typedoc-plugin-markdown@4.9.0';
 * @import { WalkEntry } from 'jsr:@std/fs@1.0.19/expand-glob';
 */

const { pkg, _: positionals } = parseArgs(Deno.args, {
    string: ["pkg"],
});

const EXIT_FLAGS = {
    Ok:              0b0000,
    CompileError:    0b0001,
    ValidationError: 0b0010,
    UnknownError:    0b0100,
};

async function generate(validate = false) {
    const packages = pkg ? [pkg] : ['utils', 'gltf'];

    /**
     * @typedef {{ path: string, title: string, children?: NavigationEntry[], kind?: number }} NavigationEntry
     */

    const root = `./site/reference/lib`;

    const app = await typedoc.Application.bootstrapWithPlugins(/** @type {TypeDocOptions & PluginOptions} */({
        name: 'revelryengine' ,
        entryPointStrategy: 'resolve',
        basePath: './packages',
        entryPoints: [
            `packages/{${packages.join(',')}}/**/*.{js,ts}`,
        ],
        out: root,
        docsRoot: './site',
        compilerOptions: {
            checkJs: true,
            target: 'esnext',

            lib: ['esnext', 'dom', 'dom.iterable'],
            module: 'esnext',
            moduleResolution: 'node',
            paths: {
                'revelryengine/*': ['./packages/*'],
                'revelryengine/deps/*': ['./deps/*'],
            }
        },
        skipErrorChecking: true,
        validation: {
            notDocumented: true,
        },
        treatValidationWarningsAsErrors: true,
        router: 'module',
        plugin: [
            'typedoc-plugin-mdn-links',
            'typedoc-plugin-merge-modules',
            'typedoc-plugin-markdown',
            'typedoc-vitepress-theme',
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
        headings: {
            readme: true,
            document: false
        },
        useHTMLAnchors: true,
        mergeModulesMergeMode: 'module',
        enumMembersFormat: 'htmlTable',
        parametersFormat: 'htmlTable',
        interfacePropertiesFormat: 'htmlTable',
        typeAliasPropertiesFormat: 'htmlTable',
        classPropertiesFormat: 'htmlTable',
        propertyMembersFormat: 'htmlTable',
        typeDeclarationFormat: 'htmlTable',
        indexFormat: 'htmlTable',
        tableColumnSettings: {
            hideDefaults: false,
            hideInherited: false,
            hideModifiers: false,
            hideOverrides: false,
            hideSources: true,
            hideValues: false,
            leftAlignHeaders: false
        },
        expandParameters: true,
        expandObjects: true,
        hidePageHeader: true,
        // navigationJson: `${root}/_navigation.json`,
        // hidePageTitle: true,
        mergeReadme: true,
        hideBreadcrumbs: true,
        useFirstParagraphOfCommentAsSummary: true,

        externalSymbolLinkMappings: {
            "gl-matrix": {
                Mat4:     'https://glmatrix.net/docs/v4/classes/Mat4.html',
                Quat:     'https://glmatrix.net/docs/v4/classes/Quat.html',
                Vec2:     'https://glmatrix.net/docs/v4/classes/Vec2.html',
                Vec3:     'https://glmatrix.net/docs/v4/classes/Vec3.html',
                Vec4:     'https://glmatrix.net/docs/v4/classes/Vec4.html',
                Mat4Like: 'https://glmatrix.net/docs/v4/types/Mat4Like.html',
                QuatLike: 'https://glmatrix.net/docs/v4/types/QuatLike.html',
                Vec2Like: 'https://glmatrix.net/docs/v4/types/Vec2Like.html',
                Vec3Like: 'https://glmatrix.net/docs/v4/types/Vec3Like.html',
                Vec4Like: 'https://glmatrix.net/docs/v4/types/Vec4Like.html',
            },
            "typescript": {
                RequestInit: 'https://developer.mozilla.org/en-US/docs/Web/API/RequestInit',
                LockOptions: 'https://developer.mozilla.org/en-US/docs/Web/API/LockManager/request#options',
                LockGrantedCallback: 'https://developer.mozilla.org/en-US/docs/Web/API/LockManager/request#callback',
                Transferable: 'https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Transferable_objects',
            }
        },
        exclude: [
            '**/__tests__/**',
            '**/node_modules/**',
        ],
        excludeExternals: true,
        intentionallyNotDocumented: [
            /** The `@context` field is problematic and this extension is archived so it's not worth sorting out */
            'gltf/KHR/archived/KHR_xmp.khrXMP.__type.@context',
            'gltf/KHR/archived/KHR_xmp.khrXMP.__type.packets',
            'gltf/KHR/archived/KHR_xmp.khrXMP.__type.extensions',


            'utils/merge.merge.__type.k',

            /** Constructor generics are not handled correctly: https://github.com/TypeStrong/typedoc/issues/3031#issuecomment-3476346397 */
            'utils/lru-cache.LRUCache.constructor.T',
            'utils/set-map.SetMap.constructor.K',
            'utils/set-map.SetMap.constructor.T',
            'utils/weak-cache.WeakCache.constructor.T',
        ],

    }));


    app.renderer.on(MarkdownPageEvent.BEGIN, output => {
        const declaration = /** @type {DeclarationReflection} */(output.model);
        // if(declaration.sources?.[0]?.fileName.endsWith('gltf-property.types.d.ts')) {
        //     console.log(Deno.inspect(declaration, {depth: 10}));
        // }
        if(declaration.kind === typedoc.ReflectionKind.Module) {
            let root = 'revelryengine/';
            let ext  = '.js';

            if(declaration.sources?.[0]?.fileName.endsWith('.d.ts')) {
                ext = '.d.ts';
            }

            // If the module is virtual, don't add the revelryengine prefix or extension suffix as it will be a complete specifier
            if(declaration.name.startsWith('@')) {
                root = '';
                ext  = '';
            }

            const path = `${root}${declaration.name}${ext}`;

            for(const child of declaration.children ?? []) {
                if(child.kind === typedoc.ReflectionKind.TypeAlias || child.kind === typedoc.ReflectionKind.Interface) {
                    child.comment?.summary?.unshift({
                        kind: 'text', text: `\n\n\`\`\`js\n\/\*\* @import { ${child.name} } from '${path}'; \*\/\n\`\`\`\n`
                    });
                } else if(child.kind === typedoc.ReflectionKind.Class || child.kind === typedoc.ReflectionKind.Variable) {
                    child.comment?.summary?.unshift({
                        kind: 'text', text: `\n\n\`\`\`js\nimport { ${child.name} } from '${path}';\n\`\`\`\n`
                    });
                } else if(child.kind === typedoc.ReflectionKind.Function) {
                    child.signatures?.[0]?.comment?.summary?.unshift({
                        kind: 'text', text: `\n\n\`\`\`js\nimport { ${child.name} } from '${path}';\n\`\`\`\n`
                    });
                }
            }

            // Remove empty type parameters from all models
            // Adjust relative-links for markdown files
            const search = [declaration];
            while(search.length > 0) {
                const child = search.shift();
                if(child?.children) {
                    search.push(...child.children);
                }
                if(child?.typeParameters?.length === 0) {
                    child.typeParameters = undefined;
                }

                const summary = [...(child?.comment?.summary ?? []), ...(child?.signatures?.map(sig => sig.comment?.summary ?? []) ?? [])].flat();

                if(summary.length) {
                    for(const part of summary) {
                        if(part.kind === 'relative-link' && declaration.sources) {
                            // @ts-expect-error - we are purposely changing the kind
                            part.kind = 'text';

                            const source    = declaration.sources[0];
                            const resolved  = new URL(part.text, Path.toFileUrl(source.fullFileName)).href;
                            const packages  = Path.toFileUrl(Path.resolve('./packages/')).href;
                            const reference = `/reference/lib/${Posix.relative(packages, resolved)}`.replace('/__docs__/', '/docs/').replace('/README.md', '/');

                            part.text = reference;

                            delete part.target;
                            delete part.targetAnchor;
                        }
                    }
                }
            }
        }
    });

    app.renderer.on(MarkdownPageEvent.END, output => {
        // Transform all `Defined in: [text](link)` links to be `[View Source](link)`
        output.contents = output.contents?.replace(/Defined in\: \[(.*?)\]\((.*?)\)/gm, (_match, _text, link) => {
            return `[View Source](${link})`;
        });

        // Strip out any node_modules Defined in links
        output.contents = output.contents?.replace(/Defined in\: \.\.\/node\\_modules\/(.*?)\n/gm, '');

        // Add `<wbr>` tags to long paths in headings
        output.contents = output.contents?.replace(/^\# (.*)$/gm, (match) => {
            return match.replace(/\//g, '/<wbr>');
        });

        // Replace any `<th>Description</th>` with `<th class="desc">Description</th>` for better styling
        output.contents = output.contents?.replace(/<th>Description<\/th>/gm, `<th class="desc">Description</th>`);
    });

    const project = await app.convert();

    if (project) {
        const warningCount = app.logger.warningCount;
        if(warningCount) {
            console.warn(`Project has ${warningCount} warnings`);
            Deno.exit(EXIT_FLAGS.CompileError);
        }
        app.validate(project);
        if(validate) {
            if (app.logger.warningCount > warningCount) {
                console.error(`Validation Failed with ${app.logger.warningCount - warningCount} warnings.`);
                Deno.exit(EXIT_FLAGS.ValidationError);
            }
            Deno.exit(EXIT_FLAGS.Ok);
        }

        // Generate configured outputs
        await app.generateOutputs(project);

        /**
         *
         * @param {WalkEntry} entry
         */
        const copy = async (entry) => {
            const path = entry.path.replace('__docs__', 'docs').replace('README.md', 'index.md');
            const relativePath = Path.relative(`./packages/`, path);
            const destPath = Path.join(`${root}/`, relativePath);
            const destDir = Path.dirname(destPath);

            await Deno.mkdir(destDir, { recursive: true });
            if(entry.path.endsWith('.md')) {
                const contents = (await Deno.readTextFile(entry.path)).replaceAll('/__docs__/', '/docs/').replaceAll('/README.md', '/');
                await Deno.writeTextFile(destPath, contents);
            } else {
                await Deno.copyFile(entry.path, destPath);
            }

        }
        // Copy all documents into corresponding lib folders
        for await (const entry of expandGlob(`./packages/**/README.md`)) {
            await copy(entry);
        }

        for await (const entry of expandGlob(`./packages/**/__docs__/**/*`)) {
            await copy(entry);
        }

        /**
         * @typedef {{text: string, link?: string, collapsed?: boolean, items?: SidebarEntry[]}} SidebarEntry
         */



        // Add link to package README and sort sidebar entries by folder and name
        const sidebarPath = `${root}/typedoc-sidebar.json`;
        const sidebar = /** @type {SidebarEntry[]}} */(JSON.parse(await Deno.readTextFile(sidebarPath)));

        for(const pkg of packages) {
            const readmeIndex = sidebar.findIndex(entry => entry.text === pkg);
            if(readmeIndex !== -1) {
                sidebar[readmeIndex].link = `/reference/lib/${pkg}/`;
            }
        }

        const search = [...sidebar];
        while(search.length > 0) {
            const entry = search.shift();
            if(entry?.items) {
                search.push(...entry.items);
                entry.items.sort((a, b) => {
                    return (Number(!!b?.items?.length) - Number(!!a?.items?.length)) || a.text.localeCompare(b.text)
                });
            }
        }
        await Deno.writeTextFile(sidebarPath, JSON.stringify(sidebar, null, 4));

        // Delete _media folder generated by typedoc
        await Deno.remove(`${root}/_media`, { recursive: true });

        console.log('Successfully generated docs.');
    } else {
        console.error('Failed to generate docs.');
        Deno.exit(EXIT_FLAGS.UnknownError);
    }
}

async function build() {
    console.log('Rebuilding docs...');
    const command = new Deno.Command(Deno.execPath(), {
        args: [
            'run',
            '-A',
            'npm:vitepress@next',
            'build',
            'site',
        ],
        stdin: 'inherit',
        stdout: 'inherit',
    });
    const process = command.spawn();
    const status = await process.status;
    if(!status.success) {
        Deno.exit(status.code);
    }
}

switch(positionals[0]) {
    case 'validate':
        await generate(true);
        break;
    case 'generate':
        await generate();
        break;
    case 'build':
        await build();
        break;
    default:
        console.error('Subcommand must be one of: validate, generate, build');
        Deno.exit(1);
}


