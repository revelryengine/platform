const UUID_REGEX = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/;

/**
 * Creats a randomly generated UUID v4 string in the xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx format.
 * @returns {String}
 */
export function UUID () {
    return crypto.randomUUID();
}

/**
 * Converts a Uint8Array byte array to the UUID v4 format string
 * @param {Uint8Array} bytes - The byte array to convert
 * @returns {String}
 */
UUID.fromBytes = (bytes) => {
    const u = [...bytes].map(b => b.toString(16).padStart(2, '0'));
    return `${u[0]}${u[1]}${u[2]}${u[3]}-${u[4]}${u[5]}-${u[6]}${u[7]}-${u[8]}${u[9]}-${u[10]}${u[11]}${u[12]}${u[13]}${u[14]}${u[15]}`;
}

/**
 * Converts a UUID v4 format string to a byte array
 * @param {String} hex - The string to convert
 * @returns {Uint8Array}
 */
UUID.toBytes = (hex) => {
    return new Uint8Array(hex.replace(/-/g, '').match(/.{1,2}/g).map(u => parseInt(u, 16)));
}

/**
 * Returns true if string is in valid UUID v4 format.
 */
UUID.isUUID = (string) => {
    return UUID_REGEX.test(string);
}

export default UUID;
