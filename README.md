# Banjo

Listen to music together (if you are on a mac and use spotify)

![](https://dl.dropboxusercontent.com/s%2Fsfmxw6dqjt8jlfw%2Fifc6kp00pxmf4p.png)

A simple way to listen to the same tracks on spotify together. Your personaly spotify account, in sync with all your friends.

Built with:

- Electron,
- React
- TailwindCSS
- Websockets and socket.io

Thans to Josh Laincz (@zohf) for his great icon!

## Using this app.

1. Download the DMG from the [releases](https://github.com/banderson623/banjo/releases).
1. Open the app, add your [banjo-server](https://github.com/banderson623/banjo-server) address
1. Update your name
1. Head to your favorite room

## Development

This is all very rough right now:

1. Clone the repo and run `yarn` to get everything installed.
1. Start the react-script based presentational layer first with `yarn start`.
1. Next start the electron dev environment via `yarn dev`
1. Optionally, grab the server from [banjo-server](https://github.com/banderson623/banjo-server) to emulate interacting with the server.

## Packaging it all up

This uses electron-builder, but I could not get it to first run `react-scripts build` which is fine, just you'll need to do the following:

1. Run `yarn run build` to build the react layer.
2. Run `yarn run dist` to build the distribution ready electron app.

**Things that still need to be fixed**

- Live reloading from react-scripts loses the local state on refresh,
- But it still saves it to disk for the next real start up. This is very annoying.
- First-launch experience is a bummer, sometimes the state isn't saved correctly and the rooms are joined.

## See Also

This requires a server running to keep all the client in sync. I built a simple one over at https://github.com/banderson623/banjo-server.

## License

MIT
