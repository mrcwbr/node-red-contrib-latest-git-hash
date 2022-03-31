const fs = require('fs');
const helper = require('node-red-node-test-helper');
const lowerNode = require('../src/latest-git-hash');

const hash = '169c335e97452983c1c30a16160e941f2f6c5ab6';
const mockBuffer = Buffer.from(hash, 'utf-8');
const mockExecSync = jest.fn().mockReturnValue(mockBuffer);

jest.mock('child_process', () => ({
  execSync: command => mockExecSync(command)
}));

describe('latest-git-hash Node', () => {

  const type = 'latest-git-hash';

  beforeEach(() => {
    helper.settings({ userDir: './anUserDir' });
  });

  it('should be loaded', (done) => {
    const flow = [{ id: 'n1', type, name: 'test name' }];

    helper.load(lowerNode, flow, () => {
      const n1 = helper.getNode('n1');
      expect(n1).toMatchObject({ name: 'test name' });
      done();
    });

  });

  it('should replace payload with git hash', (done) => {
    const flow = [
      { id: 'n1', type, name: 'test name', wires: [['n2']] },
      { id: 'n2', type: 'helper' },
    ];

    const spy = jest.spyOn(fs, 'readdirSync');
    spy.mockReturnValueOnce(['projects']).mockReturnValue(['aProject']);

    helper.load(lowerNode, flow, () => {
      const n1 = helper.getNode('n1');
      const n2 = helper.getNode('n2');

      n2.on('input', (msg) => {
        expect(spy).toHaveBeenNthCalledWith(1, './anUserDir');
        expect(spy).toHaveBeenNthCalledWith(2, './anUserDir/projects');
        expect(mockExecSync).toHaveBeenCalledWith('cd ./anUserDir/projects/aProject && git rev-parse HEAD');
        expect(msg.payload).toEqual({
          latestGitHash: '169c335e97452983c1c30a16160e941f2f6c5ab6',
          latestGitHashShort: '169c335e'
        });
        done();
      });

      n1.receive({ payload: 'a payload' });
    });

  });

  it('should add git hash to payload', (done) => {
    const flow = [
      { id: 'n1', type, name: 'test name', wires: [['n2']] },
      { id: 'n2', type: 'helper' },
    ];

    const spy = jest.spyOn(fs, 'readdirSync');
    spy.mockReturnValueOnce(['projects']).mockReturnValue(['aProject']);

    helper.load(lowerNode, flow, () => {
      const n1 = helper.getNode('n1');
      const n2 = helper.getNode('n2');

      n2.on('input', (msg) => {
        expect(msg.payload).toEqual({
          latestGitHash: '169c335e97452983c1c30a16160e941f2f6c5ab6',
          latestGitHashShort: '169c335e',
          foo: 'bar',
        });
        done();
      });

      n1.receive({ payload: { foo: 'bar' } });
    });

  });

  it('should throw if no project is not configured', (done) => {
    const flow = [
      { id: 'n1', type, name: 'test name' },
      { id: 'n2', type: 'catch', name: 'catch', wires: [['n3']] },
      { id: 'n3', type: 'helper' }
    ];

    const spy = jest.spyOn(fs, 'readdirSync');
    spy.mockReturnValueOnce([]);

    helper.load(lowerNode, flow, () => {
      const n1 = helper.getNode('n1');
      const n3 = helper.getNode('n3');

      n3.on('input', (msg) => {
        expect(msg.error.message).toBe('Error: Node Red Project is not set up (https://nodered.org/docs/user-guide/projects/)');
        done();
      });

      n1.receive({ payload: { foo: 'bar' } });
    });

  });

  it('should throw if no project is available', (done) => {
    const flow = [
      { id: 'n1', type, name: 'test name' },
      { id: 'n2', type: 'catch', name: 'catch', wires: [['n3']] },
      { id: 'n3', type: 'helper' }
    ];

    const spy = jest.spyOn(fs, 'readdirSync');
    spy.mockReturnValueOnce(['projects']).mockReturnValueOnce([]);

    helper.load(lowerNode, flow, () => {
      const n1 = helper.getNode('n1');
      const n3 = helper.getNode('n3');

      n3.on('input', (msg) => {
        expect(msg.error.message).toBe('Error: Could not find a project folder');
        done();
      });

      n1.receive({ payload: { foo: 'bar' } });
    });

  });

  afterEach(function() {
    helper.unload();
    mockExecSync.mockClear();
  });

});
