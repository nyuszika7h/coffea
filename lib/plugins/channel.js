/*jslint node: true, nomen: true*/
"use strict";

var _ = require('underscore');

var Channel = function (name, client, network) {
    this.name = name;
    this.client = client;
    this.network = network;
    this.topic = {};
    this.names = {};
};

Channel.prototype.toString = function () {
    return this.name;
};

Channel.prototype.getName = function () {
    return this.name;
};

Channel.prototype.getTopic = function () {
    return this.topic;
};

Channel.prototype.getNames = function () {
    return this.names; // {'nick': ['~']}
};

Channel.prototype.getNetwork = function () {
    return this.network;
};

Channel.prototype.userHasMode = function (user, mode) {
    user = typeof user === "string" ? user : user.getNick();
    if (this.names.hasOwnProperty(user)) {
        return this.names[user].indexOf(mode) > -1;
    }
    return false;
};

Channel.prototype.isUserInChannel = function (user) {
    user = typeof user === "string" ? user : user.getNick();
    return this.names.hasOwnProperty(user);
};

Channel.prototype.notice = function (msg) {
    this.client.notice(this.getName(), msg, this.network);
};

Channel.prototype.say = function (msg) {
    this.client.send(this.getName(), msg, this.network);
};

Channel.prototype.reply = function (user, msg) {
    user = typeof user === "string" ? user : user.getNick();
    this.say(user + ': ' + msg);
};

Channel.prototype.kick = function (user, reason) {
    user = typeof user === "string" ? user : user.getNick();
    this.client.kick(this.getName(), user, reason, this.network);
};

Channel.prototype._changeBan = function _changeBan(deleting, mask) {
    var mode;
    if (deleting) {
        mode = ' -b ';
    } else {
        mode = ' +b ';
    }
    this.client.write('MODE ' + this.getName() + mode + mask, this.network);
};

Channel.prototype.ban = function (mask) {
    this.changeBan(false, mask);
};

Channel.prototype.unban = function (mask) {
    this.changeBan(true, mask);
};

module.exports = function () {
    var channelCache = [],
        channelList = [];
    return function (irc) {

        irc.getChannellist = function () {
            return channelList;
        };

        irc.getChannel = function (name, network) {
            var channel = _.find(channelCache, function (chan) {
                if (network) { return (chan.getName() === name) && (chan.getNetwork() === network); }
                else { return chan.getName() === name; }
            });
            if (channel === undefined) {
                channel = new Channel(name, irc, network);
                channelCache.push(channel);
            }
            return channel;
        };

        irc.isChannel = function (channel) {
            return channel instanceof Channel;
        };

        irc.on('join', function (err, event) {
            //add channel to list if we joined
            if (event.user.getNick() === irc.networked_me[event.network].getNick()) {
                channelList.push(event.channel.getName());
                channelList = _.uniq(channelList);
            }
        });

        irc.on('part', function (err, event) {
            //remove channel from list if we parted
            if (event.user.getNick() === irc.networked_me[event.network].getNick()) {
                channelList = _.without(channelList, event.channel.getName());
            }
        });

        irc.on('kick', function (err, event) {
            //remove channel from list if we got kicked
            if (event.user.getNick() === irc.networked_me[event.network].getNick()) {
                channelList = _.without(channelList, event.channel.getName());
            }
        });
    };
};
