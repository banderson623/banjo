module.exports = class PluginBase {
  constructor(client) {
    this.client = client;
    console.log(`Setting up plugin: ${this.constructor.name}`);
    this.setup();
  }

  /**
   * Sends events to the server
   *
   * @param {String} eventName the name of the event to send to the server
   * @param {Object/Anything} data the data send to the server
   */
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

  /**
   * Handles incoming events from the server
   *
   * @param {String} eventName the name of the event to handle
   * @param {Function} callback the callback to execute on event reception
   */
  on(eventName, callback = () => {}) {
    this.client.socket.on(eventName, (cb) => {
      console.log(`plugin ${this.constructor.name} receiving ${eventName}`);
      callback(cb);
    });
  }

  /**
   * Will be called during plugin setup, which happens
   * once a connection is made with the server.
   *
   * this.client is an object that represents the BanjoClient instance
   * that owns this plugin.
   *
   * While its private, it might be useful?
   */
  setup() {}
};
