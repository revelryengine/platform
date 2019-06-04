import * as Core from '../../lib/core.js';

describe('Core', () => {
  it('should load module', () => {
    expect(Core).not.to.be.undefined;
  });

  it('should export Game', () => {
    expect(Core.Game).not.to.be.undefined;
  });

  it('should export Stage', () => {
    expect(Core.Stage).not.to.be.undefined;
  });

  it('should export System', () => {
    expect(Core.System).not.to.be.undefined;
  });

  it('should export EntityModel', () => {
    expect(Core.EntityModel).not.to.be.undefined;
  });

  // it('should export EventManager', () => {
  //     expect(Core.EventManager).not.to.be.undefined;
  // });

  it('should export extensions', () => {
    expect(Core.extensions).not.to.be.undefined;
  });

  it('should export component', () => {
    expect(Core.component).not.to.be.undefined;
  });

  it('should export model', () => {
    expect(Core.model).not.to.be.undefined;
  });

  it('should export timed', () => {
    expect(Core.timed).not.to.be.undefined;
  });

  it('should export headlessOnly', () => {
    expect(Core.headlessOnly).not.to.be.undefined;
  });

  it('should export nonheadlessOnly', () => {
    expect(Core.nonheadlessOnly).not.to.be.undefined;
  });
});
