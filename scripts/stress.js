const BanjoClient = require('../lib/banjo_client');

const clients = 250;
const durationInSeconds = 10;

const Rooms = [
  'testRoom-1',
  'testRoom-2',
  'testRoom-3',
  'bieber pals',
  'funzone',
  'no',
  'quiet',
];
const Reactions = ['🔥', '👎'];
const randomName = () => Math.random().toString(36).substring(7);

const pluck = (list) => {
  return list[Math.floor(Math.random() * list.length)];
};

const aFewClients = Array.from({ length: clients }, (x, i) => {
  return new Promise((resolve, reject) => {
    const client = new BanjoClient();

    // lets not trouble applescript, since we are testing the server
    client.setEnabled(false);

    let timers = [];
    client.connect('http://localhost:4000');

    timers.push(
      setInterval(() => {
        client.joinRoom(pluck(Rooms));
      }, Math.random() * 10000)
    );

    timers.push(
      setInterval(() => {
        client.using('ReactionPlugin', (plugin) => {
          plugin.sendReaction(pluck(Reactions));
        });
      }, Math.random() * 10000)
    );

    timers.push(
      setInterval(() => {
        client.setName(randomName());
      }, Math.random() * 10000)
    );

    setTimeout(() => {
      timers.forEach(clearInterval);
      client.disconnect();
      resolve();
    }, durationInSeconds * 1000);
  });
});

Promise.all(aFewClients).then(() => {
  console.log('all done');
  process.exit();
});
