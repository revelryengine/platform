import { defineConfig } from 'npm:vitepress@next';
import { parseArgs    } from 'jsr:@std/cli@1.0.23/parse-args';

import referenceSidebar from '../reference/lib/typedoc-sidebar.json' with { type: 'json' };

const { port = '8080', proxy = 'http://localhost:8081', importMode = 'local' } = parseArgs(Deno.args, {
    string: ['port', 'proxy', 'importMode'],
});

export default defineConfig({
    title: 'Revelry Engine', // This needs to be changed in the index.md frontmatter as well
    description: 'Documentation for the Revelry Game Engine', // This needs to be changed in the index.md frontmatter as well
    ignoreDeadLinks: true,
    cleanUrls: true,
    themeConfig: {
        siteTitle: false,
        search: {
            provider: 'local',
        },
        logo: {
            light: '/images/revelry-engine-light.svg',
            dark: '/images/revelry-engine-dark.svg',
        },
        nav: [
            { text: 'Guide', items: [
                { text: 'Getting Started', link: '/guide/getting-started' },
                { text: 'Introduction',    link: '/guide/introduction'    },
                { text: 'Features',        link: '/guide/features'        },
            ] },
            { text: 'Reference', items: [
                { text: 'Libraries', items: [
                    { text: 'Usage', link: '/reference/lib/' },
                    { text: 'GLTF',  link: '/reference/lib/gltf/' },
                    { text: 'Utils', link: '/reference/lib/utils/' },
                ] }
            ] },
        ],

        sidebar: {
            '/guide/': [
                { text: 'Guide', items: [
                    { text: 'Getting Started', link: '/guide/getting-started' },
                    { text: 'Introduction',    link: '/guide/introduction'    },
                    { text: 'Features',        link: '/guide/features'        },
                ] },
            ],
            '/reference/lib/': referenceSidebar,
        },
        socialLinks: [
            { icon: 'github', link: 'https://github.com/revelryengine/platform' },
        ],
        outline: { level: [2, 5] },
    },
    head: [
        ['link', { rel: 'icon', href: '/images/favicon_32.png' }],
    ],
    vite: {
        optimizeDeps: {
            exclude: [
                'revelryengine/'
            ],
        },
        server: {
            host: '0.0.0.0',
            port: Number(port),
            allowedHosts: true,
            watch: null, // Disable Vite's file watching, as it's handled by the outer dev server
            proxy: {
                '/packages/': {
                    target: proxy,
                    changeOrigin: true,
                },
                '/deps/': {
                    target: proxy,
                    changeOrigin: true,
                },
                '/samples/': {
                    target: proxy,
                    changeOrigin: true,
                },
            },
        },
        plugins: [
            {
                name: 'import-map-injector',
                transformIndexHtml(html) {
                    return html.replace(
                        '<head>',
                        `<head>\n<script>globalThis.REVELRY_IMPORT_MODE = '${importMode}';</script>\n<script src="/importmap.js"></script>\n`
                    );
                }
            }
        ]
    },
});
