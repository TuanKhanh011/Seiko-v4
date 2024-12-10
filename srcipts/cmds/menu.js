this.config = {
    name: 'menu',
    aliases: ["menu"],
    version: '1.1.1',
    role: 0,
    author: 'DC-Nam mod by DongDev',
    info: 'Xem danh sách nhóm lệnh, thông tin lệnh',
    Category: 'Box chat',
    guides: '[...name commands|all]',
    cd: 5,
    hasPrefix: true,
    images: [],
    envConfig: {
        autoUnsend: {
            status: true,
            timeOut: 60
        }
    }
};
const { autoUnsend = this.config.envConfig.autoUnsend } = global.config == undefined ? {} : global.config.menu == undefined ? {} : global.config.menu;
const { compareTwoStrings, findBestMatch } = require('string-similarity');
const { readFileSync, writeFileSync, existsSync } = require('fs-extra');
this.onRun = async function ({ api, event, args }) {
    const axios = require("axios");
    const moment = require("moment-timezone");
    const { sendMessage: send, unsendMessage: un } = api;
    const { threadID: tid, messageID: mid, senderID: sid } = event;
    const cmds = global.Seiko.commands;  
    const isAdminOrNDH = global.config.ADMINBOT.includes(sid) || global.config.NDH.includes(sid);
    const time = moment.tz("Asia/Ho_Chi_Minh").format("HH:mm:ss || DD/MM/YYYY");
    if (args.length >= 1) {
        if (typeof cmds.get(args.join(' ')) == 'object') {
            const body = infoCmds(cmds.get(args.join(' ')).config);
            return send(body, tid, mid);
        } else {
            if (args[0] == 'all') {
                const data = Array.from(cmds.values()).filter(cmd => isAdminOrNDH || cmd.config.Category.toLowerCase() !== 'admin');
                var txt = '', count = 0;
                for (const cmd of data) {
                    txt += `${++count}. ${cmd.config.name} | ${cmd.config.info}\n`;
                }
                txt += `\n⩺ Tự động gỡ tin nhắn sau: ${autoUnsend.timeOut}s`;
                return send({ body: txt, attachment: await global.tools.streamURL('https://i.imgur.com/EwDv9o2.jpeg', 'jpg')}, tid, (a, b) => autoUnsend.status ? setTimeout(v1 => un(v1), 1000 * autoUnsend.timeOut, b.messageID) : '');
            } else {
                const cmdsValue = Array.from(cmds.values()).filter(cmd => isAdminOrNDH || cmd.config.Category.toLowerCase() !== 'admin');
                const arrayCmds = cmdsValue.map(cmd => cmd.config.name);
                const similarly = findBestMatch(args.join(' '), arrayCmds);
                if (similarly.bestMatch.rating >= 0.3) return send(`📝 "${args.join(' ')}" là lệnh gần giống là "${similarly.bestMatch.target}" ?`, tid, mid);
            }
        }
    } else {
        const data = commandsGroup(isAdminOrNDH);
        var txt = '', count = 0;
        for (const { Category, commandsName } of data) {
            txt += `${++count}. ${Category} || có ${commandsName.length} lệnh\n`;
        }
        txt += `\n⩺ Tổng có: ${data.reduce((acc, cur) => acc + cur.commandsName.length, 0)} lệnh\n⩺ Reply từ 1 đến ${data.length} để chọn\n⩺ Tự động gỡ tin nhắn sau: ${autoUnsend.timeOut}s`;
        return send({ body: txt, attachment: await global.tools.streamURL('https://i.imgur.com/EwDv9o2.jpeg', 'jpg')}, tid, (a, b) => {
            global.Seiko.onReply.push({ name: this.config.name, messageID: b.messageID, author: sid, 'case': 'infoGr', data });
            if (autoUnsend.status) setTimeout(v1 => un(v1), 1000 * autoUnsend.timeOut, b.messageID);
        }, mid);
    }
};
this.onReply = async function ({ onReply: $, api, event }) {
    const { sendMessage: send, unsendMessage: un } = api;
    const { threadID: tid, messageID: mid, senderID: sid, args } = event;
    const axios = require("axios");
    const isAdminOrNDH = global.config.ADMINBOT.includes(sid) || global.config.NDH.includes(sid);
    if (sid != $.author) {
        const msg = `⛔ Cút ra chỗ khác`;
        return send(msg, tid, mid);
    }
    switch ($.case) {
        case 'infoGr': {
            var data = $.data[(+args[0]) - 1];
            if (data == undefined) {
                const txt = `❎ "${args[0]}" không nằm trong số thứ tự menu`;
                const msg = txt;
                return send(msg, tid, mid);
            }
            un($.messageID);
            var txt = `[ ${data.Category} ]\n\n`,
                count = 0;
            for (const name of data.commandsName) {
                const cmdInfo = global.Seiko.commands.get(name).config;
                if (isAdminOrNDH || cmdInfo.Category.toLowerCase() !== 'admin') {
                    txt += `${++count}. ${name}: ${cmdInfo.info}\n`;
                }
            }
            txt += `\n⩺ Reply từ 1 đến ${count} để chọn\n⩺ Tự động gỡ tin nhắn sau: ${autoUnsend.timeOut}s\n⩺ Dùng ${prefix(tid)}help + tên lệnh để xem chi tiết cách sử dụng lệnh`;
            return send({ body: txt, attachment: await global.tools.streamURL('https://i.imgur.com/EwDv9o2.jpeg', 'jpg')}, tid, (a, b) => {
                global.Seiko.onReply.push({ name: this.config.name, messageID: b.messageID, author: sid, 'case': 'infoCmds', data: data.commandsName.filter(name => isAdminOrNDH || global.Seiko.commands.get(name).config.Category.toLowerCase() !== 'admin') });
                if (autoUnsend.status) setTimeout(v1 => un(v1), 1000 * autoUnsend.timeOut, b.messageID);
            }, mid);
        }
        case 'infoCmds': {
            var data = global.Seiko.commands.get($.data[(+args[0]) - 1]);
            if (typeof data != 'object') {
                const txt = `❎ "${args[0]}" không nằm trong số thứ tự menu`;
                const msg = txt;
                return send(msg, tid, mid);
            }
            const { config = {} } = data || {};
            un($.messageID);
            const msg = infoCmds(config);
            return send(msg, tid, mid);
        }
        default:
    }
};
function commandsGroup(isAdminOrNDH) {
    const array = [],
        cmds = global.Seiko.commands.values();
    for (const cmd of cmds) {
        const { name, Category } = cmd.config;
        if (isAdminOrNDH || Category.toLowerCase() !== 'admin') {
            const find = array.find(i => i.Category == Category);
            !find ? array.push({ Category, commandsName: [name] }) : find.commandsName.push(name);
        }
    }
    array.sort(sortCompare('commandsName'));
    return array;
}
function infoCmds(a) {
    return `[ INFO COMMAND ]\n\n⩺ Tên lệnh: ${a.name}\n⩺ Phiên bản: ${a.version}\n⩺ Quyền hạn: ${premssionTxt(a.role)}\n⩺ Tác giả: ${a.author}\n⩺ Mô tả: ${a.info}\n⩺ Thuộc nhóm: ${a.Category}\n⩺ Cách dùng: ${a.guides}\n⩺ Thời gian chờ: ${a.cd} giây`;
}
function premssionTxt(a) {
    return a == 0 ? 'Thành Viên' : a == 1 ? 'Quản Trị Viên Nhóm' : a == 2 ? 'ADMINBOT' : 'Người Điều Hành';
}
function prefix(a) {
    const tidData = global.data.threadData.get(a) || {};
    return tidData.PREFIX || global.config.PREFIX;
}
function sortCompare(k) {
    return function (a, b) {
        return (a[k].length > b[k].length ? 1 : a[k].length < b[k].length ? -1 : 0) * -1;
    };
}