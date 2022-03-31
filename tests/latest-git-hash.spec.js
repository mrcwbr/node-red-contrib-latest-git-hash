const helper = require('node-red-node-test-helper');
const lowerNode = require('../src/latest-git-hash');

const hash = '169c335e97452983c1c30a16160e941f2f6c5ab6';
const mockBuffer = Buffer.from(hash, 'utf-8');
const mockExecSync = jest.fn().mockReturnValue(mockBuffer)

jest.mock('child_process', () => ({
  execSync: command => mockExecSync(command)
}));

describe('latest-git-hash Node', () => {

  const type = 'latest-git-hash';

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

    helper.load(lowerNode, flow, () => {
      const n2 = helper.getNode('n2');
      const n1 = helper.getNode('n1');

      n2.on('input', (msg) => {
        expect(msg.payload).toEqual({
          latestGitHash: "169c335e97452983c1c30a16160e941f2f6c5ab6",
          latestGitHashShort: "169c335e"
        })
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

    helper.load(lowerNode, flow, () => {
      const n2 = helper.getNode('n2');
      const n1 = helper.getNode('n1');

      n2.on('input', (msg) => {
        expect(msg.payload).toEqual({
          latestGitHash: "169c335e97452983c1c30a16160e941f2f6c5ab6",
          latestGitHashShort: "169c335e",
          foo: 'bar',
        })
        done();
      });

      n1.receive({ payload: {foo: 'bar'} });
    });

  });

  afterEach(function() {
    helper.unload();
    mockExecSync.mockClear()
  });

});
