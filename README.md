# GunSight
Broadcast or watch live camera / screen streaming through [GunDB](https://github.com/amark/gun)

## Setup
```sh
# install
npm install

# dev
npm run docker # start a local gun relay
npm run dev

# build
npm run build
```

## Credit
Credit goes to [GunStreamer](https://github.com/QVDev/GunStreamer) for the bulk of the functionality.

This is essentially a code refactor of GunStreamer to simplify understanding (for me at least), eliminate the js worker, shift towards ES6+ and sprinkle in a few bug fixes for good measure.
