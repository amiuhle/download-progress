/**
 * Module dependencies.
 */

var serveStatic = require('serve-static');
var socket = require('socket.io');
var debug = require('debug')('downloadProgress');

/**
 * Module exports.
 */

module.exports = downloadProgress;


function downloadProgress(root, options) {
  options = options || {};
  var io = options.io;
  if(!(io && io.constructor.name === 'Server')) {
    throw new TypeError('io must be socket.io');
  }
  delete options.io;

  var nsp = io.of(options.namespace || '/download-progress');
  delete options.namespace;

  var serve = serveStatic(root, options);

  // Set engine.io cookiePath to / so we get the cookie
  // when a download starts
  io.eio.cookiePath = '/';

  return function download(req, res, next) {
    var socketId = req.cookies[io.eio.cookie],
        socket = nsp.connected[socketId];

    if(!socket) {
      debug('No socket, skipping');
      return serve(req, res, next);
    }

    debug('Socket id', socketId);

    var contentLength,
        transferred = 0;
    res.on('pipe', function(src) {
      contentLength = src.end + 1;
    });

    var write = res.write;
    res.write = function(chunk, encoding, cb) {
      var delta = chunk.length;
      transferred += delta;

      var progress = {
        contentLength: contentLength,
        transferred: transferred,
        delta: delta,
        percentage: Math.round(1000 * transferred / contentLength) / 1000
      };

      debug('Progress %d% for socket %s', progress.percentage, socketId);
      socket.emit('download-progress', req.path, progress);

      return write.apply(res, arguments);
    };

    res.on('data', function() {
      console.log('data', arguments);
    });

    return serve(req, res, next);
  };
}
