import { describe, it, expect, beforeEach, afterEach, sinon, before, after } from 'bdd';

import { importmapContent } from '../importmap-content.js';

const IMPORT_MAP_FIXTURE_URL = new URL('./__fixtures__/importmap.json', import.meta.url);

describe('importmapContent', () => {
    /**
     * @type {globalThis['REV']}
     */
    let originalREV;

    /**
     * @type {ImportMap}
     */
    let content;

    before(async () => {
        originalREV = globalThis.REV;
        content = /** @type {ImportMap} */(await fetch(IMPORT_MAP_FIXTURE_URL).then(res => res.json()));
    });

    after(() => {
        globalThis.REV = originalREV;
    });

    describe('REV.importmap.content', () => {
        before(() => {
            globalThis.REV = {
                importmap: { content }
            };
        });

        it('returns global REV.importmap.content', async () => {
            expect(await importmapContent()).to.deep.equal(content);
        });
    });

    describe('REV.importmap.url', () => {
        before(() => {
            globalThis.REV = {
                importmap: {
                    url: IMPORT_MAP_FIXTURE_URL
                }
            };
        });

        it('fetches the contents from global REV.importmap.url and resolves urls relative to REV.importmap.url', async () => {
            expect(await importmapContent()).to.deep.equal({
                imports: { foo: new URL('bar', IMPORT_MAP_FIXTURE_URL).href },
                scopes: { [new URL('/scope/', IMPORT_MAP_FIXTURE_URL).href]: { baz: new URL('qux', IMPORT_MAP_FIXTURE_URL).href } }
            });
        });
    });

    describe('document importmap script', () => {
        /**
         * @type {sinon.SinonStub}
         */
        let documentQuerySelectorStub;

        before(() => {
            delete globalThis.REV;

            globalThis.document ??= /** @type {any} */ ({ querySelector: () => null });

            documentQuerySelectorStub = sinon.stub(globalThis.document, 'querySelector').returns(/** @type {Element}*/({ textContent: JSON.stringify(content) }));
        });

        after(() => {
            documentQuerySelectorStub.restore();
        });

        it('fetches content from document script content and resolves urls relative to location.href', async () => {
            expect(await importmapContent()).to.deep.equal({
                imports: { foo: new URL('bar', location.href).href },
                scopes: { [new URL('/scope/', location.href).href]: { baz: new URL('qux', location.href).href } }
            });
        });
    });

    describe('no importmap defined', () => {
        /**
         * @type {sinon.SinonStub}
         */
        let documentQuerySelectorStub;
        beforeEach(() => {
            globalThis.document ??= /** @type {any} */ ({ querySelector: () => null });
            documentQuerySelectorStub = sinon.stub(globalThis.document, 'querySelector').returns(null);
        });

        afterEach(() => {
            documentQuerySelectorStub.restore();
        });
        it('returns empty imports object when neither global nor document import maps exist', async () => {
            expect(await importmapContent()).to.deep.equal({ imports: {} });
        });
    });
});
