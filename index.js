var Busboy = require('busboy'),
    _ = require('lodash'),
    concat = require('concat-stream'),
    debug = require('debug')('busboy-body-parser');

module.exports = function (settings) {

    settings = settings || {};

    return function multipartBodyParser(req, res, next) {

        if (req.is('multipart/form-data')) {
            var busboy = new Busboy(_.extend({
                headers: req.headers,
                limits: {
                    fileSize: Math.Infinity,
                    fieldSize: Math.Infinity
                }
            }, settings));
            busboy.on('field', function (key, value) {
                debug('Received field %s: %s', key, value);
                req.body[key] = value;
            });
            busboy.on('file', function (key, file, name, enc, mimetype) {
                file.pipe(concat(function (d) {
                    debug('Received file %s', file);
                    req.files[key] = {
                        data: file.truncated ? null : d,
                        name: name,
                        encoding: enc,
                        mimetype: mimetype,
                        truncated: file.truncated,
                        size: Buffer.byteLength(d.toString('binary'), 'binary')
                    };
                }));
            });
            busboy.on('finish', function () {
                debug('Finished form parsing');
                debug(req.body);
                next();
            });
            req.files = req.files || {};
            req.body = req.body || {};
            req.pipe(busboy);
        } else {
            next();
        }

    };

};
