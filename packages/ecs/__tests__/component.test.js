import { describe, it, expect, sinon, beforeEach } from 'bdd';

import { Game, Stage, Component, ComponentSet, UUID } from '../ecs.js';

describe('Component', () => {
    /** @type {sinon.SinonSpy} */
    let handler;

    /** @type {Game} */
    let game;

    /** @type {Stage} */
    let stage;

    /** @type {string} */
    let entityA;

    /** @type {string} */
    let ownerA;

    /** @type {Component} */
    let component;

    beforeEach(() => {
        game    = new Game();
        stage   = new Stage(game, 'stage');
        entityA = UUID();
        ownerA  = UUID();

        component = new Component(stage, { entity: entityA, owner: ownerA, type: 'a', value: 'a' });
    });

    it('should have reference to stage', () => {
        expect(component.stage).to.equal(stage);
    });

    it('should have reference to entity', () => {
        expect(component.entity).to.equal(entityA);
    });

    it('should have reference to type', () => {
        expect(component.type).to.equal('a');
    });

    it('should have reference to owner', () => {
        expect(component.owner).to.equal(ownerA);
    });


    describe('value change', () => {
        beforeEach(() => {
            handler = sinon.spy();
            component.watch('value:change', handler);
        });

        it('should call watch handler when value changes', () => {
            component.value = 'change';
            expect(handler).to.have.been.calledOnce;
        });

        it('should not call watch handler when value is the same', () => {
            component.value = 'a';
            expect(handler).not.to.have.been.called;
        });
    });

    describe('toJSON', () => {
        it('should serialize to a JSON object', () => {
            expect(component.toJSON()).to.deep.equal({ entity: entityA, type: 'a', value: 'a' });
        });
    });

    describe('ComponentSet', () => {

        /** @type {sinon.SinonSpy} */
        let handler;

        /** @type {ComponentSet} */
        let components;

        /** @type {string} */
        let entityA;
        /** @type {string} */
        let entityB;

        /** @type {string} */
        let ownerA;
        /** @type {string} */
        let ownerB;

        /** @type {Component} */
        let componentA;
        /** @type {Component} */
        let componentB;
        /** @type {Component} */
        let componentC;
        /** @type {Component} */
        let componentD;
        /** @type {Component} */
        let componentE;
        /** @type {Component} */
        let componentF;
        /** @type {Component} */
        let componentG;
        /** @type {Component} */
        let componentH;

        /** @type {sinon.SinonSpy} */
        let registerSpy;
        /** @type {sinon.SinonSpy} */
        let unregisterSpy;

        beforeEach(() => {
            registerSpy   = sinon.spy();
            unregisterSpy = sinon.spy();

            components = new ComponentSet({
                register:   registerSpy,
                unregister: unregisterSpy,
            });

            entityA = UUID();
            entityB = UUID();

            ownerA = UUID();
            ownerB = UUID();

            componentA = components.add(new Component(stage, { entity: entityA, owner: ownerA, type: 'a', value: 'a' }));
            componentB = components.add(new Component(stage, { entity: entityA, owner: ownerA, type: 'b', value: 123 }));
            componentC = components.add(new Component(stage, { entity: entityA, owner: ownerA, type: 'c', value: true }));
            componentD = components.add(new Component(stage, { entity: entityA, owner: ownerA, type: 'd', value: { a: 'a' } }));

            componentE = components.add(new Component(stage, { entity: entityB, owner: ownerB, type: 'a', value: 'a' }));
            componentF = components.add(new Component(stage, { entity: entityB, owner: ownerB, type: 'b', value: 123 }));
            componentG = components.add(new Component(stage, { entity: entityB, owner: ownerB, type: 'c', value: true }));
            componentH = components.add(new Component(stage, { entity: entityB, owner: ownerB, type: 'd', value: { a: 'a' } }));
        });

        describe('add', () => {
            it('should throw error if duplicate entity and type is added', () => {
                expect(() => components.add(new Component(stage, { entity: entityA, type: 'a', value: 'a' }))).to.throw('Entity can only contain one component of a given type');
            });

            it('should call the registration handler', () => {
                expect(registerSpy).to.have.been.calledWith(componentA);
            });
        });

        describe('delete', () => {
            it('should return true if component is present', () => {
                expect(components.delete(componentA)).to.be.true;
            });

            it('should return false if component is not present', () => {
                expect(components.delete({ entity: entityA, type: 'e' })).to.be.false;
            });

            it('should return false if entity is not present', () => {
                expect(components.delete({ entity: UUID(), type: 'e' })).to.be.false;
            });

            it('should call the unregistration handler', () => {
                components.delete(componentA)
                expect(unregisterSpy).to.have.been.calledWith(componentA);
            });
        });

        describe('find', () => {
            it('should find a single component when specifying entity and type', () => {
                expect(components.find({ entity: entityA, type: 'a' })).to.equal(componentA);
                expect(components.find({ entity: entityA, type: 'b' })).to.equal(componentB);
                expect(components.find({ entity: entityA, type: 'c' })).to.equal(componentC);
                expect(components.find({ entity: entityA, type: 'd' })).to.equal(componentD);
                expect(components.find({ entity: entityB, type: 'a' })).to.equal(componentE);
                expect(components.find({ entity: entityB, type: 'b' })).to.equal(componentF);
                expect(components.find({ entity: entityB, type: 'c' })).to.equal(componentG);
                expect(components.find({ entity: entityB, type: 'd' })).to.equal(componentH);
            });

            it('should iterate over all components when specifying entity', () => {
                expect([...components.find({ entity: entityA })]).to.deep.equal([componentA, componentB, componentC, componentD]);
            });

            it('should not error when iterating over a non existent entity', () => {
                expect([...components.find({ entity: UUID() })]).to.deep.equal([]);
            });

            it('should iterate over all components when specifying type', () => {
                expect([...components.find({ type: 'a' })]).to.deep.equal([componentA, componentE]);
            });

            it('should not error when iterating over a non existent type', () => {
                expect([...components.find({ type: 'e' })]).to.deep.equal([]);
            });

            it('should iterate over all components when specifying owner', () => {
                expect([...components.find({ owner: ownerA })]).to.deep.equal([componentA, componentB, componentC, componentD]);
            });

            it('should not error when iterating over a non existent owner', () => {
                expect([...components.find({ owner: UUID() })]).to.deep.equal([]);
            });

            it('should iterate over all components when specifying entity and owner', () => {
                expect([...components.find({ entity: entityA, owner: ownerA })]).to.deep.equal([componentA, componentB, componentC, componentD]);
            });

            it('should not error when iterating over a non existent owner and entity', () => {
                expect([...components.find({ entity: entityA, owner: UUID() })]).to.deep.equal([]);
            });

            it('should iterate over all components when specifying type and owner', () => {
                expect([...components.find({ type: 'a', owner: ownerA })]).to.deep.equal([componentA]);
            });

            it('should not error when iterating over a non existent owner and type', () => {
                expect([...components.find({ type: 'a', owner: UUID() })]).to.deep.equal([]);
            });

            describe('predicate', () => {
                it('should only return the components where the predicate is true', () => {
                    expect([...components.find({ entity: entityA, predicate: () => true })]).to.deep.equal([componentA, componentB, componentC, componentD]);
                    expect([...components.find({ type: 'a', predicate: () => true })]).to.deep.equal([componentA, componentE]);
                    expect([...components.find({ owner: ownerA, predicate: () => true })]).to.deep.equal([componentA, componentB, componentC, componentD]);
                    expect([...components.find({ owner: ownerA, entity: entityA, predicate: () => true })]).to.deep.equal([componentA, componentB, componentC, componentD]);
                    expect([...components.find({ owner: ownerA, type: 'a', predicate: () => true })]).to.deep.equal([componentA]);
                    expect(components.find({ entity: entityA, type: 'a', predicate: () => true })).to.deep.equal(componentA);
                    expect([...components.find({ predicate: () => true })]).to.deep.equal([componentA, componentB, componentC, componentD, componentE, componentF, componentG, componentH]);

                    expect([...components.find({ entity: entityA, predicate: () => false })]).to.deep.equal([]);
                    expect([...components.find({ type: 'a', predicate: () => false })]).to.deep.equal([]);
                    expect([...components.find({ owner: ownerA, predicate: () => false })]).to.deep.equal([]);
                    expect([...components.find({ owner: ownerA, entity: entityA, predicate: () => false })]).to.deep.equal([]);
                    expect([...components.find({ owner: ownerA, type: 'a', predicate: () => false })]).to.deep.equal([]);
                    expect(components.find({ entity: entityA, type: 'a', predicate: () => false })).to.deep.equal(null);
                    expect([...components.find({ predicate: () => false })]).to.deep.equal([]);
                });
            });
        });

        describe('count', () => {
            it('should return the count of all components when not specifying entity or type', () => {
                expect(components.count()).to.equal(8);
            });

            it('should return the count of all components when specifying entity', () => {
                expect(components.count({ entity: entityA })).to.equal(4);
            });

            it('should return 0 when there are no components of a given entity', () => {
                expect(components.count({ entity: UUID() })).to.equal(0);
            });

            it('should return the count of all components when specifying type', () => {
                expect(components.count({ type: 'a' })).to.equal(2);
            });

            it('should return 0 when there are no components of a given type', () => {
                expect(components.count({ type: 'e' })).to.equal(0);
            });

            it('should return the count of all components when specifying owner', () => {
                expect(components.count({ owner: ownerA })).to.equal(4);
            });

            it('should return 0 when there are no components of a given owner', () => {
                expect(components.count({ owner: UUID() })).to.equal(0);
            });

            it('should return the count of all components when specifying entity and owner', () => {
                expect(components.count({ entity: entityA, owner: ownerA })).to.equal(4);
            });

            it('should return 0 when there are no components of a given entity and owner', () => {
                expect(components.count({ entity: UUID(), owner: ownerA })).to.equal(0);
            });

            it('should return the count of all components when specifying type and owner', () => {
                expect(components.count({ type: 'a', owner: ownerA })).to.equal(1);
            });

            it('should return 0 when there are no components of a given type and owner', () => {
                expect(components.count({ type: 'e', owner: ownerA })).to.equal(0);
            });

            it('should return 1 when entity and type are both specified', () => {
                expect(components.count({ entity: entityA, type: 'a' })).to.equal(1);
            });

            describe('predicate', () => {
                it('should only count the components where the predicate is true', () => {
                    expect(components.count({ entity: entityA, predicate: () => true })).to.equal(4);
                    expect(components.count({ type: 'a', predicate: () => true })).to.equal(2);
                    expect(components.count({ owner: ownerA, predicate: () => true })).to.equal(4);
                    expect(components.count({ owner: ownerA, entity: entityA, predicate: () => true })).to.equal(4);
                    expect(components.count({ owner: ownerA, type: 'a', predicate: () => true })).to.equal(1);
                    expect(components.count({ entity: entityA, type: 'a', predicate: () => true })).to.equal(1);
                    expect(components.count({ predicate: () => true })).to.equal(8);

                    expect(components.count({ entity: entityA, predicate: () => false })).to.equal(0);
                    expect(components.count({ type: 'a', predicate: () => false })).to.equal(0);
                    expect(components.count({ owner: ownerA, predicate: () => false })).to.equal(0);
                    expect(components.count({ owner: ownerA, entity: entityA, predicate: () => false })).to.equal(0);
                    expect(components.count({ owner: ownerA, type: 'a', predicate: () => false })).to.equal(0);
                    expect(components.count({ entity: entityA, type: 'a', predicate: () => false })).to.equal(0);
                    expect(components.count({ predicate: () => false })).to.equal(0);
                });
            });
        });

        describe('has', () => {
            it('should return true if there are any components for the specified entity', () => {
                expect(components.has({ entity: entityA })).to.be.true;
            });

            it('should return false if there are not any components for the specified entity', () => {
                expect(components.has({ entity: UUID() })).to.be.false;
            });

            it('should return true if there are any components for the specified type', () => {
                expect(components.has({ type: 'a' })).to.be.true;
            });

            it('should return false if there are not any components for the specified type', () => {
                expect(components.has({ type: 'e' })).to.be.false;
            });

            it('should return true if there are any components for the specified owner', () => {
                expect(components.has({ owner: ownerA })).to.be.true;
            });

            it('should return false if there are not any components for the specified owner', () => {
                expect(components.has({ owner: UUID() })).to.be.false;
            });

            it('should return true when owner and type are both specified', () => {
                expect(components.has({ owner: ownerA, type: 'a' })).to.be.true;
            });

            it('should not return true if there are no components when owner and type are both specified', () => {
                expect(components.has({ owner: ownerA, type: 'e' })).to.be.false;
            });

            it('should return true when owner and entity are both specified', () => {
                expect(components.has({ owner: ownerA, entity: entityA })).to.be.true;
            });

            it('should not return true if there are no components when owner and entity are both specified', () => {
                expect(components.has({ owner: ownerA, entity: UUID() })).to.be.false;
            });

            it('should return true when entity and type are both specified', () => {
                expect(components.has({ entity: entityA, type: 'a' })).to.be.true;
            });

            it('should not return true if there are no components when entity and type are both specified', () => {
                expect(components.has({ entity: entityA, type: 'e' })).to.be.false;
            });

            describe('predicate', () => {
                it('should only return true if the predicate is true', () => {
                    expect(components.has({ entity: entityA, predicate: () => true })).to.be.true;
                    expect(components.has({ type: 'a', predicate: () => true })).to.be.true;
                    expect(components.has({ owner: ownerA, predicate: () => true })).to.be.true;
                    expect(components.has({ owner: ownerA, entity: entityA, predicate: () => true })).to.be.true;
                    expect(components.has({ owner: ownerA, type: 'a', predicate: () => true })).to.be.true;
                    expect(components.has({ entity: entityA, type: 'a', predicate: () => true })).to.be.true;
                    expect(components.has({ predicate: () => true })).to.be.true;

                    expect(components.has({ entity: entityA, predicate: () => false })).to.be.false;
                    expect(components.has({ type: 'a', predicate: () => false })).to.be.false;
                    expect(components.has({ owner: ownerA, predicate: () => false })).to.be.false;
                    expect(components.has({ owner: ownerA, entity: entityA, predicate: () => false })).to.be.false;
                    expect(components.has({ owner: ownerA, type: 'a', predicate: () => false })).to.be.false;
                    expect(components.has({ entity: entityA, type: 'a', predicate: () => false })).to.be.false;
                    expect(components.has({ predicate: () => false })).to.be.false;
                });
            });
        });

        describe('events', () => {

            /** @type {string} */
            let entityC;

            beforeEach(() => {
                entityC = UUID();
                handler = sinon.spy();
            });

            it('should notify component:add when a new component is added', () => {
                components.watch('component:add', handler);
                components.add(new Component(stage, { entity: entityC, type: 'c', value: true }));
                expect(handler).to.have.been.calledOnce;
            });

            it('should notify component:add:${entity} when a new component is added', () => {
                components.watch(`component:add:${entityC}`, handler);
                components.add(new Component(stage, { entity: entityC, type: 'c', value: true }));
                expect(handler).to.have.been.calledOnce;
            });

            it('should notify component:add:${entity}:${type} when a new component is added', () => {
                components.watch(`component:add:${entityC}:c`, handler);
                components.add(new Component(stage, { entity: entityC, type: 'c', value: true }));
                expect(handler).to.have.been.calledOnce;
            });

            it('should notify component:delete when a component is deleted', () => {
                components.watch('component:delete', handler);
                components.delete({ entity: entityA, type: 'a' });
                expect(handler).to.have.been.calledOnce;
            });

            it('should notify component:delete:${entity} when a component is deleted', () => {
                components.watch(`component:delete:${entityA}`, handler);
                components.delete({ entity: entityA, type: 'a' });
                expect(handler).to.have.been.calledOnce;
            });

            it('should notify component:delete:${entity}:${type} when a component is deleted', () => {
                components.watch(`component:delete:${entityA}:a`, handler);
                components.delete({ entity: entityA, type: 'a' });
                expect(handler).to.have.been.calledOnce;
            });

            it('should notify entity:add when a new entity is added', () => {
                components.watch('entity:add', handler);
                components.add(new Component(stage, { entity: UUID(), type: 'c', value: true }));
                expect(handler).to.have.been.calledOnce;
            });

            it('should notify entity:add:${entity} when a new entity is added', () => {
                components.watch(`entity:add:${entityC}`, handler);
                components.add(new Component(stage, { entity: entityC, type: 'c', value: true }));
                expect(handler).to.have.been.calledOnce;
            });

            it('should notify entity:delete when an entity is deleted', () => {
                components.watch('entity:delete', handler);
                components.delete({ entity: entityA, type: 'a' });
                components.delete({ entity: entityA, type: 'b' });
                components.delete({ entity: entityA, type: 'c' });
                components.delete({ entity: entityA, type: 'd' });
                expect(handler).to.have.been.calledOnce;
            });

            it('should notify entity:delete:${entity} when an entity is deleted', () => {
                components.watch(`entity:delete:${entityA}`, { handler });
                components.delete({ entity: entityA, type: 'a' });
                components.delete({ entity: entityA, type: 'b' });
                components.delete({ entity: entityA, type: 'c' });
                components.delete({ entity: entityA, type: 'd' });
                expect(handler).to.have.been.calledOnce;
            });
        });

        describe('[Symbol.iterator]', () => {
            it('should iterate over entire set of components', () => {
                expect([...components]).to.deep.equal([componentA, componentB, componentC, componentD, componentE, componentF, componentG, componentH]);
            });
        });
    });
});
