#!/usr/bin/env node

'use strict';

var transmission = require('./transmission');
var TelegramBot = require('node-telegram-bot-api');
var auth = require('./auth');
var prettysize = require('prettysize');

var bot = new TelegramBot(auth.token, {
    polling: true
});

var statuses = {
    '6': '✅',
    'default': '💭'
}

bot.onText(/^\/start$/, function(msg) {
    var fromId = msg.from.id;
    if (!~auth.whiteList.indexOf(fromId)) {
        bot.sendMessage(fromId, '403');
        console.log('403', fromId);
        return;
    };
    bot.sendMessage(fromId, 'what do you want to do?', {
        reply_markup: {
            keyboard: [
                [{ text: 'list torrents' }],
                [{ text: 'add magnet' }]
            ]
        }
    });
});

bot.onText(/^list torrents$/, function (msg, match) {
    var fromId = msg.from.id;
    if (!~auth.whiteList.indexOf(fromId)) return;
    transmission.all(function(err, result) {
        if (err) return bot.sendMessage(fromId, 'Error' + err);
        var res = result.torrents.map(function(torrent) {
            return ([
                statuses[torrent.status] || statuses.default,
                '/' + torrent.id,
                torrent.name
            ]).join(' ')
        }).join('\n');
        bot.sendMessage(fromId, res, {
            disable_web_page_preview: true
        });
    });
});

bot.onText(/^\/(\d+)$/, function (msg, match) {
    var fromId = msg.from.id;
    if (!~auth.whiteList.indexOf(fromId)) return;
    var torrentId = +match[1];
    transmission.get([torrentId], function(err, result) {
        if (err) return bot.sendMessage(fromId, 'Error' + err);
        var startCmd = '/' + torrentId + '_';
        var torrentDetails = result.torrents[0];
        var res = [torrentDetails.name]
        res.push('Size: ' + prettysize(torrentDetails.totalSize));
        res.push('ETA: ' + (torrentDetails.eta === -1 ? 'Done' : torrentDetails.eta));
        res.push(startCmd + 'start');
        res.push(startCmd + 'stop');
        res.push(startCmd + 'delete');
        bot.sendMessage(fromId, res.join('\n'));
    });
});

var torrentCommands = {
    start: function(ids, cb) {
        return transmission.start(ids, function(err) {
            if (err) return 'Error ' + err;
            cb('Started');
        });
    },
    stop: function(ids, cb) {
        return transmission.stop(ids, function(err) {
            if (err) return 'Error ' + err;
            cb('Stopped');
        });
    },
    delete: function(ids, cb) {
        return transmission.remove(ids, function(err) {
            if (err) return 'Error ' + err;
            cb('Deleted');
        });
    }
}

bot.onText(/^\/(\d+)_(.+)$/, function (msg, match) {
    var fromId = msg.from.id;
    if (!~auth.whiteList.indexOf(fromId)) return;
    var torrentId = +match[1];
    var cmd = match[2];
    if (torrentCommands[cmd]) {
        torrentCommands[cmd]([torrentId], function(res) {
            bot.sendMessage(fromId, res);
        });
    }
});

bot.onText(/^add magnet$/, function (msg, match) {
    var fromId = msg.from.id;
    if (!~auth.whiteList.indexOf(fromId)) return;
    bot.sendMessage(fromId, 'Paste magnet', {
        reply_markup: {
            force_reply: true
        }
    }).then(function(res) {
        bot.onReplyToMessage(res.chat.id, res.message_id, function(msg) {
            var fromId = msg.from.id;
            var magnet = msg.text.match(/(magnet:\S+)/);
            if (!magnet) return bot.sendMessage(fromId, res);

            transmission.addUrl(magnet[1], function(err, arg) {
                if (err) return bot.sendMessage(fromId, 'Error ' + err);
                bot.sendMessage(fromId, 'Successfuly added torrent');
            });
        })
    });
});
