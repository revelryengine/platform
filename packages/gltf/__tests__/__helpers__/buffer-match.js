import { expect } from 'bdd';
/**
 * @import { Buffer } from '../../buffer.js';
 */
/**
  * @param {Uint8Array} buffer
  * @param {URL} url
  */
export const expectBufferToMatch = async (buffer, url) => {
    const fixture = await fetch(url).then(res => res.arrayBuffer());
    expect(buffer).to.deep.equal(new Uint8Array(fixture));
};
