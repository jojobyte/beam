# GunSight
Live Camera / Screen Streaming

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
Credit goes to https://github.com/QVDev/GunStreamer for the bulk of the functionality.

This is essentially a code refactor of GunStreamer to simplify understanding (for me at least), eliminate the js worker, shift towards ES6+ and sprinkle in a few bug fixes for good measure.
