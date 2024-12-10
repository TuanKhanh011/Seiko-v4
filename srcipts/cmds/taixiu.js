const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const moment = require("moment-timezone");
const historyFilePath = path.resolve(__dirname, '../../system/data/taixiu_history.json');
this.config = {
    name: "taixiu",
    aliases: ["taixiu"],
    version: "7.0.0",
    role: 0,
    author: "Yae Miko & Mod by DongDev",
    info: "Tài xỉu trên hệ thống Bot Seiko đa dạng nhiều kiểu",
    Category: "Game",
    guides: "[tài/xỉu] [số tiền/số %]",
    cd: 5,
    hasPrefix: true,
    images: [],
};
var tilethang = 2;
var timedelay = 2;
function replace(int) {
    var str = int.toString();
    var newstr = str.replace(/(.)(?=(\d{3})+$)/g, '$1,');
    return newstr;
}
function getImage(number) {
    switch (number) {
        case 1: return "https://i.imgur.com/cmdORaJ.jpg";
        case 2: return "https://i.imgur.com/WNFbw4O.jpg";
        case 3: return "https://i.imgur.com/Xo6xIX2.jpg";
        case 4: return "https://i.imgur.com/NJJjlRK.jpg";
        case 5: return "https://i.imgur.com/QLixtBe.jpg";
        case 6: return "https://i.imgur.com/y8gyJYG.jpg";
    }
}
function saveHistory(userId, data) {
    let history = {};
    if (fs.existsSync(historyFilePath)) {
        const fileContent = fs.readFileSync(historyFilePath, 'utf8');
        history = JSON.parse(fileContent);
    }
    if (!history[userId]) {
        history[userId] = [];
    }
    if (history[userId].length >= 8) {
        history[userId].shift();
    }
    history[userId].push(data);
    fs.writeFileSync(historyFilePath, JSON.stringify(history, null, 2));
}
function getHistory(userId) {
    if (fs.existsSync(historyFilePath)) {
        const fileContent = fs.readFileSync(historyFilePath, 'utf8');
        const history = JSON.parse(fileContent);
        if (history[userId]) {
            return history[userId];
        }
    }
    return [];
}
this.onLoad = async function () {
    if (!fs.existsSync(historyFilePath)) {
        fs.ensureFileSync(historyFilePath);
        fs.writeFileSync(historyFilePath, JSON.stringify({}, null, 2));
    }
}
this.onRun = async function ({ msg, event, api, Currencies, Users, args }) {
    try {
       const format_day = moment.tz("Asia/Ho_Chi_Minh").format("DD/MM/YYYY - HH:mm:ss");
       const { increaseMoney, decreaseMoney } = Currencies;
       const { threadID, messageID, senderID } = event;
       var name = (await Users.getData(senderID)).name;
       var money = BigInt((await Currencies.getData(event.senderID)).money);
       if (!args[1]) {
             return msg.reply("❎ Vui lòng cung cấp tiền cược");
       }
       let bet;
       if (args[1] === "all") {
          bet = BigInt(money);
           } else if (args[1].endsWith("%")) {
       const percentage = parseFloat(args[1].slice(0, -1));
       if (isNaN(percentage)) {
            return msg.reply("❎ Giá trị phần trăm không hợp lệ");
           }
          bet = BigInt(Math.floor((percentage / 100) * Number(money)));
           } else {
        const betAmount = parseInt(args[1], 10);
        if (isNaN(betAmount)) {
            return msg.reply("❎ Số tiền cược không hợp lệ");
           }
          bet = BigInt(betAmount);
        }
        if (bet < 1000 || bet > money) return api.sendMessage(bet < 1000n ? "❎ Vui lòng cược ít nhất 1000$" : "❎ Bạn không đủ tiền", threadID, messageID);
        var input = args[0];
        if (input == "tài" || input == "Tài" || input == '-t') var choose = 'tài';
        if (input == "xỉu" || input == "Xỉu" || input == '-x') var choose = 'xỉu';
        var tag = ['tài', 'xỉu'];
        if (!tag.includes(choose)) return api.sendMessage('❎ Bạn nhập sai lựa chọn, hãy chọn tài/xỉu', threadID, messageID);
        const number = [], img = [];
        api.sendMessage("🔄 Bot đang lắc, vui lòng chờ...", threadID, async (err, info) => {
            await new Promise(resolve => setTimeout(resolve, 7 * 1000));
            return api.unsendMessage(info.messageID);
        }, messageID);       
        for (let i = 1; i < 4; i++) {
            var n = Math.floor(Math.random() * 6 + 1);
            number.push(n);
            var img_ = (await axios.get(encodeURI(getImage(n)), { responseType: 'stream' })).data;
            img.push(img_);
            await new Promise(resolve => setTimeout(resolve, timedelay * 1000));
        }     
        var total = number[0] + number[1] + number[2];
        var ans;
        var result;
        var mn; 
        if (number[0] == number[1] && number[1] == number[2]) {
            ans = "bộ ba đồng nhất";
            result = 'lose';
            mn = bet;
        } else {
            ans = (total >= 11 && total <= 18 ? "tài" : "xỉu");
            if (ans == choose) {
                result = 'win';
                mn = bet * BigInt(Number(tilethang));
            } else {
                result = 'lose';
                mn = bet;
            }
        }
        let symbol;
        if (result == 'lose') {
            await Currencies.decreaseMoney(senderID, Number(mn));
            symbol = ans === "tài" ? "⚫" : "⚪";
        } else if (result == 'win') {
            await Currencies.increaseMoney(senderID, Number(mn));
            symbol = ans === "tài" ? "⚫" : "⚪";
        }
        saveHistory(senderID, symbol);
        const history = getHistory(senderID).join(' ');        
        api.sendMessage({
            body: `[ Kết Quả Tài Xỉu ]\n──────────────────\n⏰ Thời gian: ${format_day}\n👤 Người chơi ${name} đã chọn ${choose} với số tiền ${replace(bet.toString())}$\n🎲 Kết quả: ${number[0]} | ${number[1]} | ${number[2]} - ${total} (${ans})\n🤑 Tổng kết: ${(result == 'win' ? 'Thắng' : 'Thua')} ${(result == 'win' ? '+' : '-')} ${replace(mn.toString())}$\n🛎️ Status: ${(result == 'win' ? 'Đã Trả Thưởng' : 'Đã Trừ Tiền')}\n──────────────────\n📊 Phiên gần đây:\n${history}`, attachment: img
        }, threadID, messageID);
    } catch (e) {
        console.log(e);
    }
}