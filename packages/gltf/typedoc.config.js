/**
 * Minimal TypeDoc configuration file to validate code documentation.
 */

const config = {
    entryPoints: ['./**/*.js', './**/*.d.ts'],
    intentionallyNotDocumented: [
        'extensions/KHR/archived/KHR_xmp.glTFKHRXMP.__type.@context',
        'extensions/KHR/archived/KHR_xmp.glTFKHRXMP.__type.packets',
        'extensions/KHR/archived/KHR_xmp.glTFKHRXMP.__type.extensions',
    ],

    externalSymbolLinkMappings: {

    },
};

export default config;
