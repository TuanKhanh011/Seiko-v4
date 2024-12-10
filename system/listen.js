const path = require('path');
const fs = require("fs");
const moment = require('moment-timezone');
const axios = require("axios");
const qs = require('qs');
module.exports = function ({ api, models }) {
    const Users = require(process.cwd() + "/main/db/users")({ models, api });
    const Threads = require(process.cwd() + "/main/db/threads")({ models, api });
    const Currencies = require(process.cwd() + "/main/db/currencies")({ models });
    const logger = require(process.cwd() + "/main/utils/log.js");
    const config = require(process.cwd() + "/main/json/config.json");
    const moment = require('moment-timezone');
    function autoreset() {
      setInterval(async () => {
      const thoiGianHienTai = moment.tz("Asia/Ho_Chi_Minh");
      const timeRestart = Array.from({ length: 2 }, (_, i) => ({
            gio: i,
            phut: 30,
            giay: 0
       }));
      for (const thoiDiem of timeRestart) {
         if (thoiGianHienTai.hour() === thoiDiem.gio && thoiGianHienTai.minute() === thoiDiem.phut && thoiGianHienTai.second() === thoiDiem.giay) {
             process.exit(1);
               }
            }
        }, 1000);
    };
autoreset();
async function manageTokens() {
  const tokenTypesToMonitor = ['EAAAAU', 'EAAD6V7'];
  const jsonFilePath = path.join(__dirname, '/data/tokens.json');
  let tokens = {};
  if (fs.existsSync(jsonFilePath)) {
    tokens = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));
  }
  const cookie = global.account.cookie;
  for (const type of tokenTypesToMonitor) {
    let token = tokens[type];
    try {
      let response;
      if (token) {
        response = await axios.get(`https://graph.facebook.com/me?access_token=${token}`);
        if (!response.data?.error) {
          logger(`Token ${type} đang hoạt động`);
          continue;
        }
      }
      response = await axios.get(`https://alotoi.com/fb/?cookie=${cookie}&type=${type}`);
      token = response.data.token;
      tokens[type] = token;
      fs.writeFileSync(jsonFilePath, JSON.stringify(tokens, null, 2), 'utf8');
      //logger(`Cập nhật token ${type} thành công`, `[ lekhanh ]`);
    } catch (error) {
      try {
        const response = await axios.get(`https://alotoi.com/fb/?cookie=${cookie}&type=${type}`);
        token = response.data.token;
        tokens[type] = token;
        fs.writeFileSync(jsonFilePath, JSON.stringify(tokens, null, 2), 'utf8');
        //logger(`Cập nhật token ${type} thành công`, `[ lekhanh ]`);
      } catch {}
    }
  }
}
manageTokens();
setInterval(manageTokens, 2 * 60 * 60 * 1000);
const times = async () => {
    const cc = process.cwd() + '/main/json/check_data.json';
    moment.locale('vi');
    const currentTime = moment().tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DD HH:mm:ss');
    if (!fs.existsSync(cc)) {
        fs.writeFileSync(cc, JSON.stringify({ datetime: currentTime }));
    }
    const data = JSON.parse(fs.readFileSync(cc, 'utf-8'));
    if (data.datetime) {
        const savedTime = moment(data.datetime, 'YYYY-MM-DD HH:mm:ss');
        const hoursDifference = moment.duration(moment(currentTime, 'YYYY-MM-DD HH:mm:ss').diff(savedTime)).asHours();
        if (hoursDifference > (10 / 60)) {
            const inbox = await api.getThreadList(100, null, ['INBOX']);
            let groupList = inbox.filter(group => group.isSubscribed && group.isGroup);
            for (const groupInfo of groupList) {
                const threadInfo = await api.getThreadInfo(groupInfo.threadID);
                await Threads.setData(groupInfo.threadID, { threadInfo });
            }
            fs.writeFileSync(cc, JSON.stringify({ datetime: currentTime }));
            logger(`Tự động cập nhật data của ${groupList.length} box`, `[ UPDATE ]`);
        }
    } else {
        logger(`ĐÃ XẢY RA LỖI KHI UPDATE DATA!!! Lỗi: không tìm thấy thời gian!`, `[ UPDATE ]`);
    }
};
setInterval(times, 10 * 60 * 1000);
      async function checktt() {
        if (typeof global.Seiko.send_toptt === 'undefined') {
            global.Seiko.send_toptt = false;
        }
        setInterval(async () => {
            let now = moment().tz('Asia/Ho_Chi_Minh');
            if (now.hour() === 0 && now.minute() === 0 && now.second() === 0 && !global.Seiko.send_toptt) {
                global.Seiko.send_toptt = true;
                let type = 'day';
                let resetWeek = false;
                let resetMonth = false;
                if (now.date() === 1) {
                    type = 'month';
                    resetMonth = true;
                    resetWeek = now.day() === 1;
                } else if (now.day() === 1) {
                    type = 'week';
                    resetWeek = true;
                }
                const headerMap = { day: 'Top Tương Tác Ngày', week: 'Top Tương Tác Tuần', month: 'Top Tương Tác Tháng' };
                logger(`Kiểm tra tương tác [ ${type} ]`, "[ CHECKTT ]");
                const dirPath = path.join(__dirname, '../system/data/messageCounts');
                const files = fs.readdirSync(dirPath).filter(file => file.endsWith('.json'));
                const processFile = async (file) => {
                    const filePath = path.join(dirPath, file);
                    const chatId = path.basename(file, '.json');
                    try {
                        const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                        const list = jsonData[type] || [];
                        if (!Array.isArray(list)) return;
                        list.sort((a, b) => b.count - a.count);
                        const messageParts = await Promise.all(list.slice(0, 15).map(async (user, index) => {
                            const userName = await Users.getNameUser(user.id) || 'Facebook User';
                            return `${index + 1}. ${userName} - ${user.count}`;
                        }));
                        const totalMessages = list.reduce((acc, cur) => acc + cur.count, 0);
                        const messageText = `📊[ ${headerMap[type]} ]\n\n${messageParts.join('\n')}\n\n💬 Tổng tin nhắn: ${totalMessages}\n📝 Tương tác để giành top nhé`;
                        for (let attempt = 1; attempt <= 3; attempt++) {
                            try {
                                await api.sendMessage(messageText, chatId);
                                logger(`Đã gửi tin nhắn tới chatId ${chatId} sau lần thử ${attempt}`, "[ CHECKTT ]");
                                break;
                            } catch (error) {
                                if (error.error === 1545012) {
                                    console.warn(`Lỗi tạm thời khi gửi tin nhắn tới chatId ${chatId}: ${error.errorDescription}`);
                                    break;
                                }
                                if (attempt === 3) throw error;
                            }
                        }
                        jsonData[type] = [];
                        if (resetMonth && !resetWeek) {
                            jsonData['day'] = [];
                            jsonData['month'] = [];
                        } else if (resetWeek && !resetMonth) {
                            jsonData['day'] = [];
                            jsonData['week'] = [];
                        } else if (resetMonth && resetWeek) {
                            jsonData['day'] = [];
                            jsonData['week'] = [];
                            jsonData['month'] = [];
                        } else {
                            jsonData['day'] = [];
                        }
                        fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 4));
                    } catch (error) {
                        console.error(`Lỗi xử lý tệp ${filePath}:`, error);
                    }
                    await new Promise(resolve => setTimeout(resolve, 1000));
                };
                await Promise.all(files.map(file => processFile(file)));
                global.Seiko.send_toptt = false;
            }
        }, 1000);
    }
    checktt();        
(async function () {
    try {
      let threads = await Threads.getAll(),
        users = await Users.getAll(['userID', 'name', 'data']),
        currencies = await Currencies.getAll(['userID']);
        for (const data of threads) {
          const idThread = String(data.threadID);
          global.data.allThreadID.push(idThread),
          global.data.threadData.set(idThread, data['data'] || {}),
          global.data.threadInfo.set(idThread, data.threadInfo || {});
          if (data['data'] && data['data']['banned'] == !![])
          global.data.threadBanned.set(idThread,
            {
              'reason': data['data']['reason'] || '',
              'dateAdded': data['data']['dateAdded'] || ''
            });
        if (data['data'] && data['data']['commandBanned'] && data['data']['commandBanned']['length'] != 0)
          global['data']['commandBanned']['set'](idThread, data['data']['commandBanned']);
        if (data['data'] && data['data']['NSFW']) global['data']['threadAllowNSFW']['push'](idThread);
      }
      for (const dataU of users) {
        const idUsers = String(dataU['userID']);
        global.data['allUserID']['push'](idUsers);
        if (dataU.name && dataU.name['length'] != 0) global.data.userName['set'](idUsers, dataU.name);
        if (dataU.data && dataU.data.banned == 1) global.data['userBanned']['set'](idUsers, {
          'reason': dataU['data']['reason'] || '',
          'dateAdded': dataU['data']['dateAdded'] || ''
        });
        if (dataU['data'] && dataU.data['commandBanned'] && dataU['data']['commandBanned']['length'] != 0)
          global['data']['commandBanned']['set'](idUsers, dataU['data']['commandBanned']);
      }
      for (const dataC of currencies) global.data.allCurrenciesID.push(String(dataC['userID']));
      logger('Khởi tạo thành công biến môi trường', '[ SYSTEM ]');
    } catch (error) {
      return logger('Không thể tải môi trường: ' + error, 'error');
   }
}());
logger.loader(`Thời gian khởi động: ${((Date.now() - global.Seiko.timeStart) / 1000).toFixed(2)}s`);
return async function(event) {
    (async () => {
        const dataPath = path.join(__dirname, 'data', 'messageCounts');
        if (!event.isGroup) return;
        const { threadID, senderID, participantIDs } = event;
        const botID = api.getCurrentUserID();
        if (senderID === botID) return;
        const today = moment.tz("Asia/Ho_Chi_Minh").day();
        const now = Date.now();
        const filePath = path.join(dataPath, `${threadID}.json`);  
        if (!fs.existsSync(dataPath)) {
            fs.mkdirSync(dataPath, { recursive: true });
        }
        if (!fs.existsSync(filePath)) {
            const newObj = {
                total: [],
                week: [],
                day: [],
                month: [],
                time: today
            };
            for (const user of participantIDs) {
                const userObj = { id: user, count: 0, lastInteraction: null };
                newObj.total.push(userObj);
                newObj.week.push(userObj);
                newObj.day.push(userObj);
                newObj.month.push(userObj);
            }
            fs.writeFileSync(filePath, JSON.stringify(newObj, null, 4));
            logger(`Đã tạo file dữ liệu tương tác mới cho nhóm: ${threadID}`, "[ CHECKTT ]");
        }
        const data = fs.readFileSync(filePath);
        let threadData = JSON.parse(data);  
        const ensureUserData = (dataArray) => {
            for (const user of participantIDs) {
                if (!dataArray.some(e => e.id === user)) {
                    dataArray.push({ id: user, count: 0, lastInteraction: null });
                }
            }
        };   
        ensureUserData(threadData.total);
        ensureUserData(threadData.week);
        ensureUserData(threadData.day);
        ensureUserData(threadData.month);
        const updateData = (dataArray) => {
            const userIndex = dataArray.findIndex(e => e.id === senderID);
            if (userIndex === -1) {
                dataArray.push({ id: senderID, count: 1, lastInteraction: now });
            } else {
                dataArray[userIndex].count++;
                dataArray[userIndex].lastInteraction = now;
            }
        }; 
        updateData(threadData.total);
        updateData(threadData.week);
        updateData(threadData.day);
        updateData(threadData.month); 
        const buffer = Buffer.from(JSON.stringify(threadData, null, 4));
        fs.writeFileSync(filePath, buffer);
    })();
let msg = await global.utils.msg(api, event);
const { threadID, author, image, type, logMessageType, logMessageBody, logMessageData } = event;
var data_anti = JSON.parse(fs.readFileSync(global.anti, "utf8"));
const dataThread = (await Threads.getData(threadID)).threadInfo;
if (type === "change_thread_image") {
    const { ADMINBOT, NDH } = global.config;
    const botID = api.getCurrentUserID();
    var threadInf = await api.getThreadInfo(threadID);
    const findAd = threadInf.adminIDs.find((el) => el.id === author);
    const findAnti = data_anti.boximage.find((item) => item.threadID === threadID);    
    if (findAnti) {
        if (findAd || botID.includes(author)) {
            let response = await global.api.catbox(threadInf.imageSrc);
            findAnti.url = response;
            const jsonData = JSON.stringify(data_anti, null, 4);
            fs.writeFileSync(global.anti, jsonData);
            dataThread.imageSrc = event.image.url;
            await Threads.setData(threadID, { threadInfo: dataThread });
        } else {
            const res = await axios.get(findAnti.url, { responseType: "stream" });
            api.sendMessage(`⚠️ Bạn không có quyền đổi ảnh nhóm`, threadID);
            return api.changeGroupImage(res.data, threadID);
        }
    } else {
        dataThread.imageSrc = event.image.url;
        await Threads.setData(threadID, { threadInfo: dataThread });
    }
}
if (logMessageType === "log:thread-name") {
    const botID = api.getCurrentUserID();
    var threadInf = await api.getThreadInfo(threadID);
    const findAd = threadInf.adminIDs.find((el) => el.id === author);
    const findAnti = data_anti.boxname.find((item) => item.threadID === threadID);
    if (findAnti) {
        if (findAd || botID.includes(author)) {
            findAnti.name = logMessageData.name;
            const jsonData = JSON.stringify(data_anti, null, 4);
            fs.writeFileSync(global.anti, jsonData);
        } else {
            api.sendMessage(`⚠️ Bạn không có quyền đổi tên nhóm`, threadID);
            return api.setTitle(findAnti.name, threadID);
        }
    }
}
if (logMessageType === "log:user-nickname") {
    const botID = api.getCurrentUserID();
    var threadInf = await api.getThreadInfo(threadID);
    const findAd = threadInf.adminIDs.find((el) => el.id === author);
    const findAnti = data_anti.antiNickname.find((item) => item.threadID === threadID);
    if (findAnti) {
        if (findAd || botID.includes(author)) {
            findAnti.data[logMessageData.participant_id] = logMessageData.nickname;
            const jsonData = JSON.stringify(data_anti, null, 4);
            fs.writeFileSync(global.anti, jsonData);
        } else {
            api.sendMessage(`⚠️ Bạn không có quyền đổi tên người dùng`, threadID);
            return api.changeNickname(findAnti.data[logMessageData.participant_id] || "", threadID, logMessageData.participant_id);
        }
    } 
}
if (logMessageType === "log:subscribe") {
     try {
        var threadInf = await api.getThreadInfo(threadID);
        const findAd = threadInf.adminIDs.find((el) => el.id === author);
        const botID = api.getCurrentUserID();
        const isAdminOrBot = botID.includes(author) || findAd;
        if (isAdminOrBot) return;
        let threadData = data_anti.antijoin[threadID] ? true : false;
        if (threadData) {
        if (logMessageData.addedParticipants.some(i => i.userFbId === botID)) return;
        var memJoin = logMessageData.addedParticipants.map(info => info.userFbId);
        for (let idUser of memJoin) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            api.removeUserFromGroup(idUser, event.threadID, function (err) {
                if (err) {
                    console.error(err);
                    return;
                }
            });
        }
        return msg.send(`⚠️ Thực thi anti người dùng vào nhóm`);
       }
    } catch (error) {
        console.error(error);
    }
}
if (logMessageType === "log:unsubscribe") {
    const botID = api.getCurrentUserID();
    var threadInf = await api.getThreadInfo(threadID);
    const findAd = threadInf.adminIDs.find((el) => el.id === author);
    const findAnti = data_anti.antiout[threadID] ? true : false;
    if (findAnti) {
        let name = await Users.getNameUser(logMessageData.leftParticipantFbId);
        const typeOut = author == logMessageData.leftParticipantFbId ? "out" : "kick";
        if (typeOut === "out") {
            api.addUserToGroup(logMessageData.leftParticipantFbId, threadID, (error, info) => {
                if (error) {
                    api.sendMessage(`⚠️ Không thể thêm ${name} trở lại nhóm`, threadID);
                } else {
                    api.sendMessage(`⚠️ Đã thêm ${name} trở lại nhóm`, threadID);
                }
            });
        }
    }
}
let form_mm_dd_yyyy = (input = '', split = input.split('/')) => `${split[1]}/${split[0]}/${split[2]}`;
let prefix = (global.data.threadData.get(event.threadID) || {}).PREFIX || global.config.PREFIX;
let send = (msg, callback) => api.sendMessage(msg, event.threadID, callback, event.messageID);
if ((event.body || '').startsWith(prefix) && event.senderID != api.getCurrentUserID() && !global.config.NDH.includes(event.senderID) && !global.config.ADMINBOT.includes(event.senderID)) {
    let thuebot;
    try {
        thuebot = JSON.parse(require('fs').readFileSync(process.cwd() + '/system/data/rent.json', 'utf-8'));
    } catch {
        thuebot = [];
    };
    let find_thuebot = thuebot.find($ => $.t_id == event.threadID);
    if (((global.data.threadData.get(event.threadID)?.PREFIX || global.config.PREFIX) + 'callad') != event.args[0]) {
        if (!find_thuebot) {
            return api.shareContact(`❎ Nhóm của bạn chưa thuê bot, liên hệ Admin để thuê bot`, global.config.NDH[0], event.threadID);
        }
        if (new Date(form_mm_dd_yyyy(find_thuebot.time_end)).getTime() <= Date.now()) {
            return api.shareContact(`⚠️ Nhóm của bạn đã hết hạn thuê bot, liên hệ Admin để gia hạn`, global.config.NDH[0], event.threadID);
        }
    }
}
switch (event.type) {
    case "change_thread_image":
    case "message":
    case "message_reply":
    case "message_unsend":
        require("./handle/handleCreateDatabase")({ api, Threads, Users, Currencies, models })({ event });
        require("./handle/handleCommand")({ api, models, Users, Threads, Currencies })({ event });
        require("./handle/handleReply")({ api, models, Users, Threads, Currencies })({ event });
        require("./handle/handleCommandEvent")({ api, models, Users, Threads, Currencies })({ event });
        break;
    case "event":
        require("./handle/handleEvent")({ api, models, Users, Threads, Currencies })({ event });
        require("./handle/handleRefresh")({ api, models, Users, Threads, Currencies })({ event });
        break;
    case "message_reaction":
      const iconUnsendPath = path.resolve(__dirname, 'data/iconUnsend.json');
      const iconUnsendData = fs.existsSync(iconUnsendPath) ? JSON.parse(fs.readFileSync(iconUnsendPath, 'utf-8')) : [];
      const groupData = iconUnsendData.find(item => item.groupId === event.threadID);
      if ((groupData && groupData.iconUnsend === event.reaction) || (iconUnsendData.status && iconUnsendData.icon === event.reaction)) {
         if (event.senderID === api.getCurrentUserID() && event.messageID) {
           api.unsendMessage(event.messageID);
           }
       }
       require("./handle/handleReaction")({ api, models, Users, Threads, Currencies })({ event });
        break;
    default:
        break;
       }
   };
}