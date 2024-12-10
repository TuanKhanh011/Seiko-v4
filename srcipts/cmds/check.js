this.config = {
    name: "check",
    aliases: ["checktt", "cou", "count"],
    version: "1.0.3",
    role: 0,
    author: "DongDev",
    info: "Check tương tác ngày/tuần/tháng/toàn bộ",
    Category: "Box chat",
    guides: "[all/week/day/month/clear]",
    cd: 5,
    hasPrefix: true,
    images: [],
};
 
const fs = require('fs-extra');
const moment = require('moment-timezone');
const path = __dirname + '/../../system/data/messageCounts/';
this.onLoad = () => {
    if (!fs.existsSync(path) || !fs.statSync(path).isDirectory()) {
        fs.mkdirSync(path, { recursive: true });
    }
};
this.onRun = async function ({ api, event, args, Users, Threads, msg }) {
    await new Promise(resolve => setTimeout(resolve, 500));
    if (!event.isGroup && args[0] && args[0].toLowerCase() !== 'clear') {
        return msg.reply("❎ Lệnh này chỉ áp dụng trong nhóm");
    }
    const { threadID, senderID, mentions } = event;
    const query = args[0] ? args[0].toLowerCase() : '';
    let threadData = JSON.parse(fs.readFileSync(path + threadID + '.json', 'utf-8'));
    if (!fs.existsSync(path + threadID + '.json')) {
        return msg.reply("❎ Nhóm chưa có dữ liệu");
    }  
    if (query === 'clear') {
        const allowedUserIDs = global.config.NDH.map(id => id.toString());
        const senderIDStr = senderID.toString();
        if (!allowedUserIDs.includes(senderIDStr)) {
           return msg.reply(`❎ Cần quyền admin chính để thực hiện lệnh`);
        }
        var inbox = await api.getThreadList(100, null, ['INBOX']);
        let list = [...inbox].filter(group => group.isSubscribed && group.isGroup);
        let groupIDs = list.map(group => group.threadID);
        const checkttData = fs.readdirSync(path);
        let deletedFiles = [];
        checkttData.forEach(file => {
            const fileID = file.replace('.json', '');
            if (!groupIDs.includes(fileID)) {
                fs.unlinkSync(path + file);
                deletedFiles.push(fileID);
            }
        });
        if (deletedFiles.length === 0) {
            return msg.reply("✅ Không có nhóm nào dư thừa");
        } else {
            return msg.reply(`✅ Đã xóa ${deletedFiles.length} nhóm dư thừa`);
        }
    } else if (query === 'lọc') {
    const dataThread = (await Threads.getData(event.threadID)).threadInfo;
    if (!dataThread.adminIDs.some(item => item.id == api.getCurrentUserID())) {
        return msg.reply('❎ Bot cần quyền quản trị viên!');
    }
    if (!dataThread.adminIDs.some(item => item.id == senderID)) {
        return msg.reply('❎ Bạn không đủ quyền hạn để lọc thành viên!');
    }
    if (!args[1] || isNaN(args[1]) || parseInt(args[1]) < 0) {
        return msg.reply("❎ Vui lòng nhập số tin nhắn tối thiểu không âm");
    }
    let minCount = parseInt(args[1]);
    let allUser = event.participantIDs; 
    let id_rm = [];
    for (let user of allUser) {
        if (user == api.getCurrentUserID()) continue;
        if (!threadData.total.some(e => e.id == user) || threadData.total.find(e => e.id == user).count <= minCount) {
            await new Promise(resolve => setTimeout(async () => {
                try {
                    await api.removeUserFromGroup(user, threadID);
                    id_rm.push(user);
                } catch (error) {
                    console.log(`Lỗi khi xóa người dùng ID: ${user}`, error);
                }
                resolve(true);
            }, 1000));
        }
     }
     if (id_rm.length > 0) {
        let removedUsersMsg = id_rm.map((id, index) => `${index + 1}. ${global.data.userName.get(id) || 'Người dùng Facebook'}`).join('\n');
        return msg.reply(`✅ Đã xóa ${id_rm.length} thành viên dưới ${minCount} tin nhắn:\n\n${removedUsersMsg}`);
      } else {
        return msg.reply(`✅ Không có thành viên nào dưới ${minCount} tin nhắn`);
       }
    } else if (query === 'help') {
      return msg.reply({body:``, attachment: await global.tools.streamURL('https://files.catbox.moe/i7pukx.png', 'jpg')});
    } else if (query === 'reset') {
       const dataThread = (await Threads.getData(event.threadID)).threadInfo;
       if (!dataThread.adminIDs.some(item => item.id == senderID)) {
           return msg.reply('❎ Bạn không đủ quyền hạn để reset!');
        }
       threadData.total = [];
       threadData.week = [];
       threadData.day = [];
       threadData.month = [];
       fs.writeFileSync(path + threadID + '.json', JSON.stringify(threadData, null, 4));
       return msg.reply("✅ Đã reset tất cả tương tác của nhóm!");
    } else if (query === 'call') {
        const dataThread = (await Threads.getData(event.threadID)).threadInfo;
        if (!dataThread.adminIDs.some(item => item.id == senderID)) {
            return msg.reply('❎ Bạn không đủ quyền hạn để sử dụng tính năng này!');
        }
        let dataDay = threadData.day;
        let participantIDs = (await Threads.getInfo(threadID)).participantIDs;
        const lowInteractionIds = dataDay.filter(user => user.count < 10).map(user => user.id);
        const mentions = [];
        let tag = '';
        for (let i = 0; i < lowInteractionIds.length; i++) {
            const id = lowInteractionIds[i];
            const name = await Users.getNameUser(id);
            mentions.push({ tag: name, id });
            tag += `${i + 1}. @${name}\n`;
        }
        const message = {
            body: `📣 Dậy tương tác đi mấy bé:\n\n${tag}`,
            mentions: mentions
        };
        msg.send(message);
        return;
    } else if (query === 'die') {
    const botIsAdmin = dataThread.adminIDs.some(item => item.id == api.getCurrentUserID());
    const userIsAdmin = dataThread.adminIDs.some(item => item.id == senderID);
    if (!botIsAdmin) return msg.reply('❎ Bot cần quyền quản trị viên!');
    if (!userIsAdmin) return msg.reply('❎ Bạn không đủ quyền hạn để lọc thành viên!');
    const { userInfo, adminIDs } = await api.getThreadInfo(event.threadID);
    const fbUsers = userInfo.filter(user => user.gender === undefined).map(user => user.id);
    const botAdmin = adminIDs.some(admin => admin.id == api.getCurrentUserID());
    if (fbUsers.length === 0) return msg.reply("🔎 Nhóm không có người dùng fb");
    msg.send(`🔎 Phát hiện ${fbUsers.length} người dùng fb`, event.threadID, async () => {
        if (!botAdmin) return msg.send("❎ Vui lòng thêm bot làm qtv rồi thử lại");
        let success = 0, fail = 0;
        for (const id of fbUsers) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            api.removeUserFromGroup(id, event.threadID, err => err ? fail++ : success++);
        }
         msg.send(`🔎 Đã xóa ${success} người dùng facebook, thất bại: ${fail}`);
       });
    }
    let data;
    let header = '';
    switch (query) {                  
    case 'all':
    case '-a':
        data = threadData.total;
        header = '[ Tương Tác Tổng ]';
        break;
    case 'week':
    case '-w':
        data = threadData.week;
        header = '[ Tương Tác Tuần ]';
        break;
    case 'day':
    case '-d':
        data = threadData.day;
        header = '[ Tương Tác Ngày]';
        break;
    case 'month':
    case '-m':
        data = threadData.month;
        header = '[ Tương Tác Tháng ]';
        break;
        default: {
    const UID = event.messageReply ? event.messageReply.senderID : Object.keys(mentions)[0] || senderID;
    const sortedTotal = threadData.total.slice().sort((a, b) => b.count - a.count);
    const userData = sortedTotal.find(e => e.id === UID) || {};
    const userTotal = userData.count || 0;
    const userRank = sortedTotal.findIndex(e => e.id === UID);
    const userTotalWeek = threadData.week.find(e => e.id === UID)?.count || 0;
    const userTotalDay = threadData.day.find(e => e.id === UID)?.count || 0;
    const userTotalMonth = threadData.month.find(e => e.id === UID)?.count || 0;
    const lastInteraction = userData.lastInteraction ? moment(userData.lastInteraction).tz('Asia/Ho_Chi_Minh').format('HH:mm:ss | DD/MM/YYYY') : 'Không có';
    const nameUID = await Users.getNameUser(UID) || 'Facebook User';
    const target = UID === senderID ? 'Bạn' : nameUID;
    const totalMessagesDay = threadData.day.reduce((acc, curr) => acc + curr.count, 0);
    const userInteractionRate = totalMessagesDay ? ((userTotalDay / totalMessagesDay) * 100).toFixed(2) : 0;
    const totalUsers = sortedTotal.length;
    const threadInfo = (await Threads.getData(event.threadID)).threadInfo;
       let permission;
       if (global.config.NDH.includes(UID)) {
            permission = `Người Điều Hành`;
         } else if (global.config.ADMINBOT.includes(UID)) {
            permission = `Admin Bot`;
         } else if (threadInfo.adminIDs.some(i => i.id == UID)) {
            permission = `Quản Trị Viên`
         } else {
            permission = `Thành viên`;
       }
    msg.reply(`✨ Tương tác của ${nameUID}:\n🪪 Chức vụ: ${permission}\n📆 Tin nhắn trong ngày: ${userTotalDay}\n📅 Tin nhắn trong tuần: ${userTotalWeek}\n🗓️ Tin nhắn trong tháng: ${userTotalMonth}\n💬 Tổng tin nhắn: ${userTotal}\n🏆 Xếp hạng: ${userRank + 1}/${totalUsers}\n⏰ Lần tt cuối: ${lastInteraction}\n📊 Tỉ lệ tương tác: ${userInteractionRate}%\n\n📌 Thả "😆" để xem tất cả tin nhắn nhóm`, 
    (err, info) => {
      if (!err) {
         global.Seiko.onReaction.push({
            name: this.config.name,
            messageID: info.messageID,
            author: event.senderID,
            iduser: UID,
             });
           }
       });
      return;
       }
    }
    for (const item of data) {
        const userName = await Users.getNameUser(item.id) || 'Facebook User';
        item.name = userName;
    }
    const sortedTotal = data.slice().sort((a, b) => b.count - a.count);
    const userRank = sortedTotal.findIndex(item => item.id === event.senderID);
    data.sort((a, b) => b.count - a.count);
    let body = data.map((item, index) => {
    const lastInteraction = item.lastInteraction ? moment(item.lastInteraction).tz('Asia/Ho_Chi_Minh').format('HH:mm:ss | DD/MM/YYYY') : 'Không có';
        return `${index + 1}. ${item.name} - ${item.count}`;
    }).join('\n');
    const totalMessages = data.reduce((acc, item) => acc + item.count, 0);
    const userMessages = sortedTotal[userRank]?.count || 0;
    const totalUsers = sortedTotal.length;
    msg.reply(`${header}\n\n${body}\n\n💬 Tổng tin nhắn: ${totalMessages}\n🏆 Bạn đứng thứ ${userRank + 1}/${totalUsers} với ${userMessages} tin nhắn\n📌 Reply (phản hồi) + stt để xóa thành viên ra khỏi nhóm`, (err, info) => {   
    if (!err) {
        global.Seiko.onReply.push({
                name: this.config.name,
                messageID: info.messageID,
                tag: 'locmen',
                thread: event.threadID,
                author: event.senderID,
                storage: sortedTotal,
            });
        }
    });
    return;
};
this.onReaction = async function({ msg, event, Users, api, onReaction: _ }) {
    if (event.userID !== _.author) return;
    if (event.reaction !== "😆") return;
        const filePath = `${path}${event.threadID}.json`;
        if (!fs.existsSync(filePath)) return msg.reply('❎ Chưa có dữ liệu');
        let threadData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        const data = threadData.total;
        for (const item of data) {
            const userName = await Users.getNameUser(item.id) || 'Facebook User';
            item.name = userName;
        }
        const sortedTotal = data.slice().sort((a, b) => b.count - a.count);
        const userRank = sortedTotal.findIndex(item => item.id === _.iduser);
        const nameUID = await Users.getNameUser(_.iduser) || 'Facebook User';
        const target = event.senderID === _.iduser ? 'Bạn' : nameUID;
        const userMessages = sortedTotal[userRank]?.count || 0;
        let body = sortedTotal.map((item, index) => {
            const lastInteraction = item.lastInteraction ? moment(item.lastInteraction).tz('Asia/Ho_Chi_Minh').format('HH:mm:ss | DD/MM/YYYY') : 'Không có';
            return `${index + 1}. ${item.name} - ${item.count}`;
        }).join('\n');
        let msgg = `[ Tương Tác Tổng ]\n\n${body}\n\n💬 Tổng tin nhắn: ${data.reduce((a, b) => a + b.count, 0)}\n🏆 ${target} đứng thứ ${userRank + 1} với ${userMessages} tin nhắn\n📌 Reply (phản hồi) + stt để xóa thành viên ra khỏi nhóm`;
        msg.reply(msgg, (err, info) => {
            if (err) return console.error(err);
            global.Seiko.onReply.push({
                name: this.config.name,
                messageID: info.messageID,
                tag: 'locmen',
                thread: event.threadID,
                author: event.senderID,
                storage: sortedTotal,
            });
        });
        msg.unsend(_.messageID);
};
this.onReply = async function({ api, event, onReply, Threads, Users, msg }) {
        const { senderID, body } = event;
        const dataThread = (await Threads.getData(event.threadID)).threadInfo;
        if (!dataThread.adminIDs.some(item => item.id == api.getCurrentUserID())) {
            return msg.reply('❎ Bot cần quyền quản trị viên!');
        }
        if (!dataThread.adminIDs.some(item => item.id == senderID)) {
            return msg.reply('❎ Bạn không đủ quyền hạn để lọc thành viên!');
        }
        const split = body.split(" ").filter(item => !isNaN(item) && item.trim() !== "");
        if (split.length === 0) return msg.reply('⚠️ Dữ liệu không hợp lệ');
        let msgReply = [], countErrRm = 0;
        for (let $ of split) {
            let id = onReply?.storage[$ - 1]?.id;
            if (id) {
                try {
                    await api.removeUserFromGroup(id, event.threadID);
                    const userName = global.data.userName.get(id) || await Users.getNameUser(id);
                    msgReply.push(`${$}. ${userName}`);
                } catch (e) {
                    countErrRm++;
                    continue;
                }
            }
        }
    msg.reply(`🔄 Đã xóa ${split.length - countErrRm} người dùng thành công, thất bại ${countErrRm}\n\n${msgReply.join('\n')}`);
};