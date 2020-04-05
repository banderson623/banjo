const PluginBase = require('./base');

module.exports = class ReactionPlugin extends PluginBase {
  setup() {
    this.reactionCallbacks = [];

    // Listen for the server to send reactions
    this.on('reaction', (data) => {
      console.log('i got a reaction from the server', data);
      this.reactionCallbacks.forEach((cb) => cb(data));
    });
  }

  onReaction(callback) {
    console.log('registering reaction callback', callback);
    this.reactionCallbacks.push(callback);
  }

  sendReaction(reaction) {
    this.emit('reaction', reaction);
  }
};
