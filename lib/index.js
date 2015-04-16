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


function downloadProgress(root, io, sessionStore, options) {
  options = options || {};
  if(!(io /*&& io.constructor.name === 'Server'*/)) {
    throw new TypeError('io must be socket.io');
  }

  var nsp = io.of(options.namespace || '/download-progress');

  return function download(req, res, next) {

    if(!minimatch(req.path, root)) {
      debug('Ignoring %s', req.path);
      return next();
    }
    debug('Intercepting request %s', req.path);

    var sessionId = req.query.sid;

    sessionStore.load(sessionId, function(err, session) {
      console.log('session load', session);
      if(session === undefined || err) {
        console.log('error: ', err, session);
        return next();
      }

      var socketId = session.socketId,
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
        console.log('contentLength: ', contentLength);
      });

      var previousPercentage;

      var write = res.write;
      res.write = function(chunk, encoding, cb) {
        try {
          var delta = chunk.length;
          transferred += delta;

          var percentage = Math.round(100 * transferred / contentLength) / 100;

          if(percentage != previousPercentage) {
            var progress = {
              contentLength: contentLength,
              transferred: transferred,
              delta: delta,
              percentage: percentage
            };

            debug('Progress %d% for socket %s', Math.round(progress.percentage * 100), socket.id);
            socket.emit('download-progress', req.path, progress);
            previousPercentage = percentage;
          }
        } catch(e) {
          console.error('Error sending downloadProgress', e);
        } finally {
          return write.apply(res, arguments);
        }
      };

      return next();
    });
  };
}
