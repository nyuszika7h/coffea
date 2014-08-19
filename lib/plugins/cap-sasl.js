/*jslint node: true*/
"use strict";

var utils = require('../utils');
var Buffer = require('buffer');

module.exports = function () {
    return function (irc) {
        irc.sasl = {
            method: '',
            mechanism: function saslMechanism(mechanism, network, fn) {
                if (typeof network ===  'function') { // (fn)
                    fn = network;
                    network = '';
                }

                irc.sasl.method = mechanism;

                irc.once('cap_ack', function (event) {
                    if(event.capabilities === 'sasl') {
                        // Send method/mechanism
                        irc.write("AUTHENTICATE " + mechanism);
                    }
                });
            },
            login: function saslLogin(account, password, network, fn) {
                if (typeof network ===  'function') { // (fn)
                    fn = network;
                    network = '';
                }

                irc.on('data', function(msg, network) {
                    if(msg.command === 'AUTHENTICATE' && msg.params === '+' && irc.sasl.method === "PLAIN") {
                        // Send our PLAIN password now!
                        var data = new Buffer(account+'\0'+account+'\0'+password).toString('base64');

                        irc.write("AUTHENTICATE "+data);
                    }
                });
            }
        };
    };
};