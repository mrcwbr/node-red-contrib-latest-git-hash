module.exports = function(RED) {

  function LatestGitHashNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;

    node.on('input', function(msg) {
      const buffer = require('child_process').execSync('git rev-parse HEAD')
      const latestGitHash = buffer.toString().trim();
      const latestGitHashShort = latestGitHash.substring(0, 8);

      if (typeof msg.payload === 'object') {
        msg.payload = { ...msg.payload, latestGitHash, latestGitHashShort };
      } else {
        msg.payload = { latestGitHash, latestGitHashShort };
      }

      node.send(msg);
    });
  }

  RED.nodes.registerType('latest-git-hash', LatestGitHashNode);
};
