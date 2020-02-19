import { expect } from '../../support/chai.js';

import { ObjectPath } from '../../../lib/utils/object-path.js';

/** @test {ObjectPath} */
describe('ObjectPath', () => {
    let path, target;
    beforeEach(() => {
        target = { foo: { bar: [1, 2, 3], baz: 123 } };
    });

    /** @test {ObjectPath#assign} */
    describe('assign', () => {
        it('should assign a nested value to an object', () => {
            path = new ObjectPath('foo', 'bar', 0);
            path.assign(target, 'test');
            expect(target.foo.bar[0]).to.equal('test');
        });

        it('should create nested properties if they do not exist', () => {
            path = new ObjectPath('foo', 'baz');
            path.assign(target, 'test');
            expect(target.foo.baz).to.equal('test');
        });

        it('should create deeply nested properties if they do not exist', () => {
            path = new ObjectPath('foo', 'bat', 'boo');
            path.assign(target, 'test');
            expect(target.foo.bat).not.to.be.undefined;
            expect(target.foo.bat.boo).to.equal('test');
        });

        it('should create nested properties as array if path key is a positive integer', () => {
            path = new ObjectPath('foo', 'bat', 0);
            path.assign(target, 'test');
            expect(Array.isArray(target.foo)).not.to.be.true;
            expect(Array.isArray(target.foo.bat)).to.be.true;
            expect(target.foo.bat[0]).to.equal('test');
        });
    });

    /** @test {ObjectPath#read} */
    describe('read', () => {
        it('should read a nested value from an object', () => {
            path = new ObjectPath('foo', 'bar', 0);
            expect(path.read(target)).to.equal(1);
        });

        it('should return undefined if the nested property does not exist', () => {
            path = new ObjectPath('foo', 'bat');
            expect(path.read(target)).to.be.undefined;
        });

        it('should return undefined if any level of the nested property does not exist', () => {
            path = new ObjectPath('foo', 'bat', 'boo');
            expect(path.read(target)).to.be.undefined;
        });
    });
});
