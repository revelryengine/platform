import { parseArgs  } from 'jsr:@std/cli@1.0.23/parse-args';
import { expandGlob } from 'jsr:@std/fs@1.0.19/expand-glob';
import * as Path from 'jsr:@std/path@1.1.2';

import * as typedoc from 'npm:typedoc@0.28.14';
import { MarkdownPageEvent } from 'npm:typedoc-plugin-markdown@4.9.0';
import 'npm:typedoc-plugin-mdn-links@5.0.10';
import 'npm:typedoc-plugin-merge-modules@7.0.0';
import 'npm:typedoc-vitepress-theme@1.1.2';

/**
 * @import { TypeDocOptions } from 'npm:typedoc@0.28.14';
 * @import { PluginOptions } from 'npm:typedoc-plugin-markdown@4.9.0';
 */

const { pkg, validate } = parseArgs(Deno.args, {
    string: ["pkg"],
    boolean: ["validate"],
});

const packages = pkg ? [pkg] : ['utils', 'gltf'];

const EXIT_FLAGS = {
    Ok:              0b0000,
    CompileError:    0b0001,
    ValidationError: 0b0010,
    UnknownError:    0b0100,
};

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
    // @ts-expect-error - Markdown plugin types are incorrect
    if(output.model.kind === typedoc.ReflectionKind.Module) {
        let root = 'revelryengine/';
        let ext  = '.js';

        // If the module is virtual, don't add the revelryengine prefix or extension suffix as it will be a complete specifier
        if(output.model.name.startsWith('@')) {
            root = '';
            ext  = '';
        }

        const path = `${root}${output.model.name}${ext}`;

        // @ts-expect-error - Markdown plugin types are incorrect
        for(const child of output.model.children ?? []) {
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
    }

    // Remove empty type parameters from all models
    // @ts-expect-error - Markdown plugin types are incorrect
    const search = /** @type {MarkdownPageEvent.model[]} */([...(output.model.children ?? [])]);
    while(search.length > 0) {
        const child = search.shift();
        if(child?.children) {
            search.push(...child.children);
        }
        if(child?.typeParameters?.length === 0) {
            child.typeParameters = undefined;
        }
    }
});
app.renderer.on(MarkdownPageEvent.END, output => {
    // Inject import example
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
    }

    // Generate configured outputs
    await app.generateOutputs(project);

    // Copy all documents into corresponding lib folders
    for await (const entry of expandGlob(`./packages/**/*.md`)) {
        const relativePath = Path.relative(`./packages/`, entry.path);
        const destPath = Path.join(`${root}/`, relativePath);
        const destDir = Path.dirname(destPath);
        await Deno.mkdir(destDir, { recursive: true });
        await Deno.copyFile(entry.path, destPath.replace('README.md', 'index.md'));
    }

    /**
     * @typedef {{text: string, link?: string, collapsed?: boolean, items?: SidebarEntry[]}} SidebarEntry
     */

    // Sort sidebar entries by folder and name
    const sidebarPath = `${root}/typedoc-sidebar.json`;
    const sidebar = /** @type {SidebarEntry[]}} */(JSON.parse(await Deno.readTextFile(sidebarPath)));
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
} else {
    console.error('Failed to generate docs.');
    Deno.exit(EXIT_FLAGS.UnknownError);
}
