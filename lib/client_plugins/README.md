# Banjo Client Plugins

Banjo Client plugins are used to extend what banjo client can do. This is roughly symmetrical to the plugin system on the server.

## Reference

- `setup()` – _Override_ – This method will be called on your plugin when it is being setup and a connection is established with the server.
- `this.on(eventName, callbackFunction)` – Register to have the callback called when a new message matching eventName is received
- `this.emit(eventName, data)` – Send an event with name and data to the server.

## How they work.

When a connection is established with the server, your plugin's `setup()` method will be called.

To handle events coming in register a new event handler using `this.on()` inside your setup code. For example, the following example will listen for friend requests events coming from the server.

```js
class OverlySocialPlugin extends PluginBase {
  setup() {
    this.on('friendRequest', (data) => {
      console.log(`you got a friend request from ${data.name}`);
    });
  }
  //...
}
```

and to send events back to the server using...

```js
class OverlySocialPlugin extends PluginBase {
  //...
  acceptFriendRequest(friendsName) {
    this.emit('makeFriendsWith', { name: friendsName });
  }
}
```

Also note that we can send data back to the server using `this.emit(messageName, messageData)`.

## But, using them in the electron app?

This is where I experimented a bit by using a different approach than before. Obviously we want the plugins to be able to expand the public interface of the BanjoClient. Adding prototype functions directly to this wasn't ideal (or i am not javascript-smart enough 😢).

We add a new construct called `using('PluginName', (pluginInstance => {}))` to expose the plugins methods to the script interacting with the client.

Lets build a small plugin as an example:

in `plugins/overly_social_plugin.js`:

```js
const PluginBase = require('./base');

module.exports = class OverlySocialPlugin extends PluginBase {
  setup() {
    this.callbacks = [];
    // Listen for the server to send reactions
    this.on('friendRequest', (data) => {
      // do something with this request, for now lets log it out
      console.log('friendRequest', data);
    });
  }

  // And you want to let your interface register for friend requests
  onIncomingFriendRequest(callback) {
    this.callbacks.push(callback);
  }

  // And the plugin is allowing
  sendFriendResponse(name, response) {
    this.emit('friendResponse', { name, response });
  }
};
```

And here, where the Banjo Client is instantated and used, say in your electron App somewhere.

```js
const client = new BanjoClient();

client.using('OverlySocialPlugin', (plugin) => {
  let lastRequestedName;

  plugin.onFriendRequest((data) => {
    console.log(`request just came in from, ${data.name}`);
    lastRequestedName = data.name;
    // probably do something in the UI/application space too
  });

  //
  setInterval(() => {
    if (!lastRequestedName) return;

    plugin.sendFriendResponse(
      lastRequestedName,
      'Not ready to be your banjo buddy yet'
    );
  }, 5000);
});
```

This `using()` abstraction will wait to call this code until the plugin is setup and a connection is established, regardless of where or when it called in your code. (Because of this it is also possible to never get called if the server is unavailable.)
