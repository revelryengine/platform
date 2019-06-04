import { IdSet } from '../../../lib/utils/id-set.js';

/** @test {IdSet} */
describe('IdSet', () => {
  let itemA, itemB, idSet;

  beforeEach(() => {
    itemA = { id: 'itemA' };
    itemB = { id: 'itemB' };
    idSet = new IdSet();
    idSet.add(itemA);
    idSet.add(itemB);
  });

  it('should add items to set', () => {
    expect(idSet.has(itemA)).to.be.true;
    expect(idSet.has(itemB)).to.be.true;
  });

  it('should be able to find item by id', () => {
    expect(idSet.getById('itemA')).to.equal(itemA);
    expect(idSet.getById('itemB')).to.equal(itemB);
  });

  it('should remove item from set', () => {
    idSet.delete(itemA);
    expect(idSet.has(itemA)).to.be.false;
  });

  it('should not be able to find item by id of removed item', () => {
    idSet.delete(itemA);
    expect(idSet.getById('itemA')).to.be.undefined;
  });
});
