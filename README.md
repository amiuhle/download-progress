Download Progress
=================

Show progress of file downloads in the browser using [socket.io](http://socket.io)

Example
-------

```js
// server
var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);

// Tell downloadProgress to send progress for *.dat requests
// Make sure to attach `downloadProgress` before `serveStatic`
app.use(downloadProgress('/*.dat', io));
app.use(express.static('public'));
```

```js
// client
var socket = io(location.host + '/download-progress');
socket.on('download-progress', function(path, data) {
  console.log(data.percentage * 100 + '%');
});
```

### Demo

For a working demo, install dependencies using `npm install`, `cd demo` and run `node index.js`. Server will listen on http://localhost:3000/

The sample file of 200mb is not contained in the repository, to generate it use

```bash
# Linux
fallocate -l 200m demo/public/200mb.dat

# Mac
dd if=/dev/zero of=demo/public/200mb.dat bs=1024 count=204800
```

Documentation
-------------

### `downloadProgress(match, options)`

Returns an express middleware.
  - `match` minimatch to restrict handled urls (**required**)
  - `io` socket.io instance to use (**required**)
  - `options` A hash of options
    - `namespace` The socket.io namespace to attach to (`/download-progress`)
