const fs = require('fs');

module.exports = function(RED) {

  function LatestGitHashNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;

    node.on('input', function(msg) {
      const { userDir } = RED.settings;

      const userDirContent = fs.readdirSync(userDir);
      if (!userDirContent.includes('projects')) {
        throw new Error('Node Red Project is not set up (https://nodered.org/docs/user-guide/projects/)');
      }

      const projectsDirContent = fs.readdirSync(userDir + '/projects');
      const projectFolderName = projectsDirContent.find(name => !name.startsWith('.'));
      if (!projectFolderName) {
        throw new Error('Could not find a project folder');
      }

      const projectPath = userDir + '/projects/' + projectFolderName;
      const command = 'cd ' + projectPath + ' && git rev-parse HEAD';

      const buffer = require('child_process').execSync(command);
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
