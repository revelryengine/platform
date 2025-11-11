/**
 * Minimal TypeDoc configuration file to validate code documentation.
 */

const config = {
    entryPoints: ['./**/*.js', './**/*.d.ts'],
    intentionallyNotDocumented: [
        'extensions/KHR/archived/KHR_xmp.khrXMP.__type.@context',
        'extensions/KHR/archived/KHR_xmp.khrXMP.__type.packets',
        'extensions/KHR/archived/KHR_xmp.khrXMP.__type.extensions',
    ],

    externalSymbolLinkMappings: {

    },
};

export default config;
