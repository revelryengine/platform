import { describe, it, expect, sinon, beforeEach } from 'bdd';

import { GLTFProperty, JSONPointer, NamedGLTFProperty } from '../gltf-property.js';

const BASE_URI = new URL('https://revelry.local/test.gltf');

/**
 * @import { ReferenceField } from '../gltf-property.types.d.ts';
 */

describe('GLTFProperty', () => {

    class TestProperty extends GLTFProperty {
        /**
         * @param {Record<string, any>} unmarshalled
         */
        constructor(unmarshalled) {
            super(unmarshalled);
            Object.assign(this, unmarshalled);
        }
    }

    it('loadOnce caches the in-flight load promise', async () => {
        const property = new TestProperty({});
        const loadSpy = sinon.spy(property, 'load');

        const first = property.loadOnce();
        const second = property.loadOnce();

        expect(first).to.equal(second);

        await first;
        expect(loadSpy).to.have.been.calledOnce;
    });

    it('load also calls load on extensions that are GLTFProperty instances', async () => {
        const signal = new AbortController().signal;
        const extension = new TestProperty({});
        const loadSpy = sinon.spy(extension, 'load');
        const nonProperty = { load: sinon.stub().throws(new Error('should not run')) };

        const property = new GLTFProperty({});
        property.extensions = /** @type {Record<string, any>} */ ({
            'ext-property': extension,
            'ext-non-property': nonProperty,
        });

        const result = await property.load(signal);

        expect(result).to.equal(property);
        expect(loadSpy).to.have.been.calledOnceWithExactly(signal);
        expect(nonProperty.load).not.to.have.been.called;
    });

    it('reports supported extensions through the registry helper', () => {
        const extensionName = 'EXT_isSupported_check';
        expect(GLTFProperty.extensions.isSupported(extensionName)).to.be.false;

        GLTFProperty.extensions.add(extensionName, { schema: {} });

        expect(GLTFProperty.extensions.isSupported(extensionName)).to.be.true;
        expect(GLTFProperty.extensions.isSupported('EXT_missing_support')).to.be.false;
    });

    describe('fromJSON', () => {
        /**
         * @typedef {{
         *  graph: {
         *      root: Record<string, any>,
         *      parent: Record<string, any>
         *  },
         *  json:   Record<string, any>,
         *  referenceFields: Record<string, ReferenceField>,
         * }} UnmarshallScenario
         */

        class ReferencedProperty extends TestProperty {

        }

        class UnmarshalledProperty extends TestProperty {

        }

        class ExtensionProperty extends TestProperty {

        }

        GLTFProperty.extensions.add('EXT_example', {
            schema: {
                //@ts-expect-error - We are creating a test extension property
                'ScenarioProperty': ExtensionProperty,
            }
        });

        const graphTemplate = {
            uri: BASE_URI.href,
            root:   {
                items: [
                    { name: 'Item0', extras: { value: 10 } },
                    { name: 'Item1' }
                ],
                extensions: {
                    EXT_example: {
                        items: [{ name: 'EXTItem0' }]
                    }
                }
            },
            parent: {
                items: [
                    { name: 'ParentItem0' },
                    { name: 'ParentItem1' }
                ]
            }
        };

        /**
         * Executes a scenario against
         * @param {UnmarshallScenario} scenario
         * @returns {Record<string, any>}
         */
        const runScenario = (scenario) => {
            class ScenarioProperty extends UnmarshalledProperty {
                /**
                 * @override
                 */
                static referenceFields = scenario.referenceFields;
            }
            return ScenarioProperty.fromJSON(scenario.json, scenario.graph);
        };

        it('resolves root collection references', () => {
            const result = runScenario({
                graph: structuredClone(graphTemplate),
                json: {
                    itemRef: 1
                },
                referenceFields: {
                    itemRef: {
                        factory: () => ReferencedProperty,
                        collection: 'items'
                    }
                }
            });

            expect(result).to.be.instanceOf(UnmarshalledProperty);
            expect(result.itemRef).to.be.instanceOf(ReferencedProperty);
            expect(result.itemRef.name).to.equal('Item1');
        });

        it('assigns value provided in reference field', () => {
            const result = runScenario({
                graph: structuredClone(graphTemplate),
                json: {
                    itemRef: 1
                },
                referenceFields: {
                    itemRef: {
                        factory: () => ReferencedProperty,
                        collection: 'items',
                        assign: { assigned: 'foobar' }
                    }
                }
            });

            expect(result.itemRef.assigned).to.equal('foobar');
        });

        it('resolves collection references without factories', () => {
            const graph = structuredClone(graphTemplate);
            const result = runScenario({
                graph,
                json: {
                    itemRef: 0
                },
                referenceFields: {
                    itemRef: {
                        collection: 'items'
                    }
                }
            });

            expect(result.itemRef).to.equal(graph.root.items[0]);
        });

        it('sets alias field with resolved reference', () => {
            const result = runScenario({
                graph: structuredClone(graphTemplate),
                json: {
                    itemRef: 1
                },
                referenceFields: {
                    itemRef: {
                        factory: () => ReferencedProperty,
                        collection: 'items',
                        alias: 'foobar'
                    }
                }
            });
            expect(result.foobar).to.equal(result.itemRef);
        });

        it('resolves parent collection references', () => {
            const result = runScenario({
                graph: structuredClone(graphTemplate),
                json: {
                    itemRef: 1
                },
                referenceFields: {
                    itemRef: {
                        factory: () => ReferencedProperty,
                        collection: 'items',
                        location: 'parent'
                    }
                }
            });

            expect(result.itemRef).to.be.instanceOf(ReferencedProperty);
            expect(result.itemRef.name).to.equal('ParentItem1');
        });

        it('resolves arrays of references while caching duplicates', () => {
            const result = runScenario({
                graph: structuredClone(graphTemplate),
                json: {
                    multiRefs: [0, 1, 0]
                },
                referenceFields: {
                    multiRefs: {
                        factory: () => ReferencedProperty,
                        collection: 'items'
                    }
                }
            });

            expect(result.multiRefs).to.have.lengthOf(3);
            expect(result.multiRefs[0]).to.equal(result.multiRefs[2]);
            expect(result.multiRefs[1]).to.not.equal(result.multiRefs[0]);
            expect(result.multiRefs[0].name).to.equal('Item0');
        });

        it('resolves nested referenceFields', () => {
            const result = runScenario({
                graph: structuredClone(graphTemplate),
                json: { nested: { child: 0 } },
                referenceFields: {
                    nested: {
                        referenceFields: {
                            child: {
                                factory: () => ReferencedProperty,
                                collection: 'items',
                            }
                        }
                    }
                }
            });

            expect(result.nested.child).to.be.instanceOf(ReferencedProperty);
            expect(result.nested.child.name).to.equal('Item0');
        });

        it('resolves nested referenceFields against the parent graph', () => {
            const result = runScenario({
                graph: structuredClone(graphTemplate),
                json: { nested: { child: 0 } },
                referenceFields: {
                    nested: {
                        referenceFields: {
                            child: {
                                factory: () => ReferencedProperty,
                                collection: 'items',
                                location: 'parent'
                            }
                        }
                    }
                }
            });

            expect(result.nested.child).to.be.instanceOf(ReferencedProperty);
            expect(result.nested.child.name).to.equal('ParentItem0');
        });

        it('instantiates inline arrays of GLTFProperty data', () => {
            const result = runScenario({
                graph: structuredClone(graphTemplate),
                json: {
                    inlineRefs: [
                        { name: 'InlineA' },
                        { name: 'InlineB' }
                    ]
                },
                referenceFields: {
                    inlineRefs: {
                        factory: () => ReferencedProperty
                    }
                }
            });

            expect(result.inlineRefs[0]).to.be.instanceOf(ReferencedProperty);
            expect(result.inlineRefs[0].name).to.equal('InlineA');
            expect(result.inlineRefs[1]).to.be.instanceOf(ReferencedProperty);
            expect(result.inlineRefs[1].name).to.equal('InlineB');
        });

        it('instantiates inline object references without collections', () => {
            const result = runScenario({
                graph: structuredClone(graphTemplate),
                json: {
                    inlineObject: { name: 'InlineSingle' }
                },
                referenceFields: {
                    inlineObject: {
                        factory: () => ReferencedProperty
                    }
                }
            });

            expect(result.inlineObject).to.be.instanceOf(ReferencedProperty);
            expect(result.inlineObject.name).to.equal('InlineSingle');
        });

        it('applies assign metadata for inline object references', () => {
            const result = runScenario({
                graph: structuredClone(graphTemplate),
                json: {
                    inlineObject: { name: 'InlineAssigned' }
                },
                referenceFields: {
                    inlineObject: {
                        factory: () => ReferencedProperty,
                        assign: { assigned: 'inline' }
                    }
                }
            });

            expect(result.inlineObject.assigned).to.equal('inline');
        });

        it('resolves references from nested collection paths (EXT_items)', () => {
            const result = runScenario({
                graph: structuredClone(graphTemplate),
                json: {
                    itemRef: 0
                },
                referenceFields: {
                    itemRef: {
                        factory: () => ReferencedProperty,
                        collection: ['extensions', 'EXT_example', 'items']
                    }
                }
            });

            expect(result.itemRef).to.be.instanceOf(ReferencedProperty);
            expect(result.itemRef.name).to.equal('EXTItem0');
        });

        it('resolves URL reference fields using the URL factory', () => {
            const result = runScenario({
                graph: structuredClone(graphTemplate),
                json: {
                    urlRef: 'textures/baseColor.png'
                },
                referenceFields: {
                    urlRef: {
                        factory: () => URL
                    }
                }
            });

            expect(result.urlRef).to.be.instanceOf(URL);
            expect(result.urlRef.href).to.equal(new URL('textures/baseColor.png', BASE_URI).href);
        });

        describe('JSON Pointer references', () => {
            /**
             * @type {Record<string, any>}
             */
            let result;
            beforeEach(() => {
                result = runScenario({
                    graph: structuredClone(graphTemplate),
                    json: {
                        itemRef: 0,
                        pointerField: '/items/0/extras'
                    },
                    referenceFields: {
                        itemRef: {
                            factory: () => ReferencedProperty,
                            collection: 'items'
                        },
                        pointerField: {
                            factory: () => JSONPointer,
                        }
                    }
                });
            });

            it('creates reference to target instance', () => {
                expect(result.pointerField.target).to.be.instanceOf(ReferencedProperty);
                expect(result.pointerField.target.name).to.equal('Item0');
            });

            it('creates getter and setter for value', () => {
                expect(result.pointerField.value).to.deep.equal({ value: 10 });
                result.pointerField.value = { value: 20 };
                expect(result.pointerField.target.extras).to.deep.equal({ value: 20 });
            });

            it('creates reference to rootTarget', () => {
                expect(result.pointerField.rootTarget).to.equal(result.pointerField.target);
            });

            it('creates reference to collection name', () => {
                expect(result.pointerField.collection).to.equal('/items');
            });

            it('throws when pointer targets are not resolveable yet', () => {
                const result = runScenario({
                    graph: structuredClone(graphTemplate),
                    json: {
                        pointerField: '/items/0/extras'
                    },
                    referenceFields: {
                        pointerField: {
                            factory: () => JSONPointer,
                        }
                    }
                });

                expect(() => result.pointerField.target).to.throw('Invalid State');
            });

            it('throws for invalid JSON pointer formats', () => {
                expect(() => runScenario({
                    graph: structuredClone(graphTemplate),
                    json: {
                        pointerField: '/items/extras'
                    },
                    referenceFields: {
                        pointerField: {
                            factory: () => JSONPointer,
                        }
                    }
                })).to.throw('Invalid JSON Pointer');
            });
        });

        it('instantiates registered extensions into GLTFProperty instances', () => {
            const result = runScenario({
                graph: structuredClone(graphTemplate),
                json: {
                    extensions: {
                        EXT_example: { strength: 1 },
                        OTHER_extension: { untouched: true },
                    }
                },
                referenceFields: {}
            });

            expect(result.extensions.EXT_example).to.be.instanceOf(ExtensionProperty);
            expect(result.extensions.EXT_example.strength).to.equal(1);
            expect(result.extensions.OTHER_extension).to.deep.equal({ untouched: true });
        });

        it('reuses instantiated references for the same root graph', () => {
            const graph = structuredClone(graphTemplate);
            const first = runScenario({
                graph,
                json: {
                    itemRef: 1
                },
                referenceFields: {
                    itemRef: {
                        factory: () => ReferencedProperty,
                        collection: 'items'
                    }
                }
            });
            const second = runScenario({
                graph,
                json: {
                    itemRef: 1
                },
                referenceFields: {
                    itemRef: {
                        factory: () => ReferencedProperty,
                        collection: 'items'
                    }
                }
            });
            expect(first.itemRef).to.equal(second.itemRef);
        });

        it('reuses extension instances for the same root graph', () => {
            const graph = structuredClone(graphTemplate);
            const scenario = {
                graph,
                json: {
                    extensions: {
                        EXT_example: { strength: 5 }
                    }
                },
                referenceFields: {}
            };

            const first = runScenario(scenario);
            const second = runScenario(scenario);

            expect(first.extensions.EXT_example).to.equal(second.extensions.EXT_example);
        });

        it('allows subclasses to override prepareJSON before unmarshalling', () => {
            const parentGraph = structuredClone(graphTemplate.parent);
            const rootGraph   = structuredClone(graphTemplate.root);

            class HookedProperty extends UnmarshalledProperty {
                /**
                 * @override
                 */
                static referenceFields = {
                    itemRef: { factory: () => ReferencedProperty, collection: 'items' },
                };

                /**
                 * @override
                 * @param {Record<string, any>} json
                 * @param {Partial<import('../gltf-property.types.d.ts').FromJSONGraph>} [graph]
                 * @returns {import('../gltf-property.types.d.ts').PreparedFromJSON}
                 */
                static prepareJSON(json, graph = {}) {
                    return {
                        json: { ...json, prepared: true },
                        graph: {
                            ...graph,
                            root: rootGraph,
                        },
                    };
                }
            }

            const prepareSpy = sinon.spy(HookedProperty, 'prepareJSON');

            const result = HookedProperty.fromJSON({ itemRef: 0 }, { parent: parentGraph });
            const typedResult = /** @type {HookedProperty & { prepared: boolean, itemRef: ReferencedProperty & { name: string } }} */(result);

            expect(prepareSpy).to.have.been.calledOnce;
            expect(typedResult).to.be.instanceOf(UnmarshalledProperty);
            expect(typedResult.prepared).to.be.true;
            expect(typedResult.itemRef).to.be.instanceOf(ReferencedProperty);
            expect(typedResult.itemRef.name).to.equal('Item0');
        });


    });


});

describe('NamedGLTFProperty', () => {
    it('constructs NamedGLTFProperty instances with provided metadata', () => {
        const extras = { foo: 'bar' };
        const named = new NamedGLTFProperty({ name: 'TestName', extras });

        expect(named).to.be.instanceOf(NamedGLTFProperty);
        expect(named.name).to.equal('TestName');
        expect(named.extras).to.equal(extras);
    });
});



