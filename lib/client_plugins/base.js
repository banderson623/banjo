module.exports = class PluginBase {
  constructor(client) {
    this.client = client;
    console.log(`Setting up plugin: ${this.constructor.name}`);
    this.setup();
  }

  emit(eventName, data = {}) {
    if (this.client.socket !== null) {
      console.log(
        `plugin ${this.constructor.name} sending ${eventName} - ${data}`
      );
      this.client.socket.emit(eventName, data);
    } else {
      console.log('no connection to emit', eventName, data);
    }
  }

  on(eventName, callback = () => {}) {
    this.client.socket.on(eventName, (cb) => {
      console.log(`plugin ${this.constructor.name} receiving ${eventName}`);
      callback(cb);
    });
  }
};
