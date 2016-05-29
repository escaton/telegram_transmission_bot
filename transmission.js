'use strict';

var Transmission = require('transmission');
var auth = require('./auth');
var transmission = new Transmission({
    host: '192.168.100.8',
    port: 9091,
    username: auth.transmission.login,
    password: auth.transmission.pass
});

module.exports = transmission;