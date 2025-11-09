/**
 * Minimal TypeDoc configuration file to validate code documentation.
 */

const config = {
    entryPoints: ['./lib/**/*.js', './lib/**/*.d.ts'],
    intentionallyNotDocumented: [
        'lib/extensions/KHR/archived/KHR_xmp.glTFKHRXMP.__type.@context',
        'lib/extensions/KHR/archived/KHR_xmp.glTFKHRXMP.__type.packets',
        'lib/extensions/KHR/archived/KHR_xmp.glTFKHRXMP.__type.extensions',
    ],

    externalSymbolLinkMappings: {

    },
};

export default config;
