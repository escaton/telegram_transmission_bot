'use strict';

var Transmission = require('transmission');
var auth = require('./auth');
var transmission = new Transmission({
    host: '127.0.0.1',
    port: 9091,
    username: auth.transmission.login,
    password: auth.transmission.pass
});

module.exports = transmission;
