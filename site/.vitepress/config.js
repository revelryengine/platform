import { defineConfig } from 'npm:vitepress@next';

import utilsSidebar from '../reference/lib/utils/_sidebar.json' with { type: 'json' };
import gltfSidebar  from '../reference/lib/gltf/_sidebar.json'  with { type: 'json' };

// https://vitepress.dev/reference/site-config
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
        // https://vitepress.dev/reference/default-theme-config
        logo: {
            light: '/images/revelry-engine-light.svg',
            dark: '/images/revelry-engine-dark.svg',
        },
        nav: [
            { text: 'Guide', items: [
                { text: 'Getting Started', link: '/guide/getting-started' },
                { text: 'Introduction', link: '/guide/introduction' },
                { text: 'Features', link: '/guide/features' },
            ] },
            { text: 'Reference', items: [
                { text: 'Libraries', items: [
                    { text: 'Usage', link: '/reference/lib/README.md' },
                    { text: 'GLTF',  link: '/reference/lib/gltf/README.md' },
                    { text: 'Utils', link: '/reference/lib/utils/README.md' },
                ] }
            ] },
        ],

        sidebar: {
            '/guide/': [
                { text: 'Guide', items: [
                    { text: 'Getting Started', link: '/guide/getting-started' },
                    { text: 'Introduction', link: '/guide/introduction' },
                    { text: 'Features', link: '/guide/features' },
                ] },
            ],
            '/reference/lib/': [
                { text: 'Library Usage', link: '/reference/lib/README.md' },
                gltfSidebar,
                utilsSidebar,
            ],
        },
        socialLinks: [
            { icon: 'github', link: 'https://github.com/revelryengine/platform' },
        ],
        outline: { level: [2, 5] },
    },
    head: [
        ['link', { rel: 'icon', href: '/images/favicon_32.png' }],
    ],
});
