/**
 * Module dependencies.
 */

var socket = require('socket.io');
var debug = require('debug')('downloadProgress');
var minimatch = require('minimatch');
var cookie = require('cookie');

/**
 * Module exports.
 */

module.exports = downloadProgress;


function downloadProgress(root, io, options) {
  options = options || {};
  if(!(io && io.constructor.name === 'Server')) {
    throw new TypeError('io must be socket.io');
  }

  var nsp = io.of(options.namespace || '/download-progress');

  // Set engine.io cookiePath to / so we get the cookie
  // when a download starts
  io.eio.cookiePath = '/';

  return function download(req, res, next) {

    if(!minimatch(req.path, root)) {
      debug('Ignoring %s', req.path);
      return next();
    }
    debug('Intercepting request %s', req.path);

    var cookies = cookie.parse(req.headers.cookie || '');
    console.log('cookies', cookies);

    var socketId = cookies[io.eio.cookie],
        socket = nsp.connected[socketId];

    if(!socket) {
      debug('No socket, skipping');
      return next();
    }

    debug('Socket id', socketId);

    var contentLength,
        transferred = 0;
    res.on('pipe', function(src) {
      contentLength = src.end + 1;
    });

    var write = res.write;
    res.write = function(chunk, encoding, cb) {
      try {
        var delta = chunk.length;
        transferred += delta;

        var progress = {
          contentLength: contentLength,
          transferred: transferred,
          delta: delta,
          percentage: Math.round(1000 * transferred / contentLength) / 1000
        };

        debug('Progress %d% for socket %s', progress.percentage, socket.id);
        socket.emit('download-progress', req.path, progress);
      } catch(e) {
        console.error('Error sending downloadProgress', e);
      } finally {
        return write.apply(res, arguments);
      }
    };

    res.on('data', function() {
      console.log('data', arguments);
    });

    return next();
  };
}
