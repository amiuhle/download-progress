/**
 * Module dependencies.
 */

var serveStatic = require('serve-static');
var socket = require('socket.io');

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

  var namespace = io.of(options.namespace || '/download-progress');
  delete options.namespace;

  namespace = io;


  var serve = serveStatic(root, options);

  return function download(req, res, next) {
    console.log('download');
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
        percentage: transferred / contentLength
      };

      console.log(progress);
      namespace.emit('download-progress', {
        url: req.path,
        progress: progress
      });

      return write.apply(res, arguments);
    };

    res.on('data', function() {
      console.log('data', arguments);
    });

    return serve(req, res, next);
  };
}
