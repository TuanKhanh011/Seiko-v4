this.config = {
 name: "anti",
 aliases: ["antist"],
 version: "1.2.9",
 role: 3,
 author: "BraSL & update DongDev",
 info: "Anti change Box chat vip pro",
 Category: "Admin",
 guides: "anti dùng để bật tắt",
 cd: 5,
 hasPrefix: true,
 images: [],
};
const { readdirSync, readFileSync, writeFileSync, existsSync, unlinkSync } = require("fs-extra");
const path = require('path');
const fs = require('fs');
const axios = require('axios');
this.onLoad = function() {
  const filePath = path.resolve(__dirname, '..', '..', 'system', 'data', 'antisetting.json');
  if (!existsSync(filePath)) {
    const initialData = {
      boxname: [],
      boximage: [],
      antiNickname: [],
      antiout: {},
      antiEmoji: {},
      antiTheme: {},
      antiQtv: {},
      antijoin: {}
    };
    writeFileSync(filePath, JSON.stringify(initialData, null, 4));
    }
};

this.onReply = async function ({ api, event, args, onReply, Threads }) {
  const { senderID, threadID, messageID, messageReply } = event;
  const { author, permssion } = onReply;
  const Tm = (require('moment-timezone')).tz('Asia/Ho_Chi_Minh').format('HH:mm:ss || DD/MM/YYYY');
  const pathData = global.anti;
  const dataAnti = JSON.parse(readFileSync(pathData, "utf8"));
  let dataThread = (await Threads.getData(threadID)).threadInfo;
  if (author !== senderID) return api.sendMessage(`❎ Bạn không phải người dùng lệnh`, threadID);

  var number = event.args.filter(i => !isNaN(i));
  for (const num of number) {
    switch (num) {
      case "1": {
        if (permssion < 1)
          return api.sendMessage("⚠️ Bạn không đủ quyền hạn để sử dụng lệnh này", threadID, messageID);

        const antiBoxname = dataAnti.boxname.find(item => item.threadID === threadID);
        if (antiBoxname) {
          dataAnti.boxname = dataAnti.boxname.filter(item => item.threadID !== threadID);
          api.sendMessage("☑️ Tắt thành công chế độ anti đổi tên box", threadID, messageID);
        } else {
          const threadName = (await api.getThreadInfo(event.threadID)).threadName;
          dataAnti.boxname.push({ threadID, name: threadName });
          api.sendMessage("☑️ Bật thành công chế độ anti đổi tên box", threadID, messageID);
        }
        writeFileSync(pathData, JSON.stringify(dataAnti, null, 4));
        break;
      }
      case "2": {
        if (permssion < 1)
          return api.sendMessage("⚠️ Bạn không đủ quyền hạn để sử dụng lệnh này", threadID, messageID);

        const antiImage = dataAnti.boximage.find(item => item.threadID === threadID);
        if (antiImage) {
          dataAnti.boximage = dataAnti.boximage.filter(item => item.threadID !== threadID);
          api.sendMessage("☑️ Tắt thành công chế độ anti đổi ảnh box", threadID, messageID);
        } else {
          const threadInfo = await api.getThreadInfo(event.threadID);
          let url = threadInfo.imageSrc;
          let response = await global.api.catbox(url);
          dataAnti.boximage.push({ threadID, url: response });
          api.sendMessage("☑️ Bật thành công chế độ anti đổi ảnh box", threadID, messageID);
        }
        writeFileSync(pathData, JSON.stringify(dataAnti, null, 4));
        break;
      }
      case "3": {
        if (permssion < 1)
          return api.sendMessage("⚠️ Bạn không đủ quyền hạn để sử dụng lệnh này", threadID, messageID);

        const NickName = dataAnti.antiNickname.find(item => item.threadID === threadID);
        if (NickName) {
          dataAnti.antiNickname = dataAnti.antiNickname.filter(item => item.threadID !== threadID);
          api.sendMessage("☑️ Tắt thành công chế độ anti đổi biệt danh", threadID, messageID);
        } else {
          const nickName = (await api.getThreadInfo(event.threadID)).nicknames;
          dataAnti.antiNickname.push({ threadID, data: nickName });
          api.sendMessage("☑️ Bật thành công chế độ anti đổi biệt danh", threadID, messageID);
        }
        writeFileSync(pathData, JSON.stringify(dataAnti, null, 4));
        break;
      }
      case "4": {
        if (permssion < 1)
          return api.sendMessage("⚠️ Bạn không đủ quyền hạn để sử dụng lệnh này", threadID, messageID);

        if (dataAnti.antiout[threadID] === true) {
          dataAnti.antiout[threadID] = false;
          api.sendMessage("☑️ Tắt thành công chế độ anti out", threadID, messageID);
        } else {
          dataAnti.antiout[threadID] = true;
          api.sendMessage("☑️ Bật thành công chế độ anti out", threadID, messageID);
        }
        writeFileSync(pathData, JSON.stringify(dataAnti, null, 4));
        break;
      }
      case "5": {
        const emojiData = dataAnti.antiEmoji || {};
        let emoji = dataThread.emoji || "";
        if (!emojiData[threadID]) {
          emojiData[threadID] = { emoji, enabled: true };
        } else {
          emojiData[threadID].enabled = !emojiData[threadID].enabled;
          if (emojiData[threadID].enabled) {
            emojiData[threadID].emoji = emoji;
          }
        }
        dataAnti.antiEmoji = emojiData;
        const statusMessage = emojiData[threadID].enabled ? "Bật" : "Tắt";
        api.sendMessage(`☑️ ${statusMessage} thành công chế độ anti emoji`, threadID, messageID);
        writeFileSync(pathData, JSON.stringify(dataAnti, null, 4));
        break;
      }
      case "6": {
        const themeData = dataAnti.antiTheme || {};
        let theme = dataThread.threadTheme.id || "";
        if (!themeData[threadID]) {
          themeData[threadID] = { themeid: theme, enabled: true };
        } else {
          themeData[threadID].enabled = !themeData[threadID].enabled;
          if (themeData[threadID].enabled) {
            themeData[threadID].themeid = theme;
          }
        }
        dataAnti.antiTheme = themeData;
        const statusMessage = themeData[threadID].enabled ? "Bật" : "Tắt";
        api.sendMessage(`☑️ ${statusMessage} thành công chế độ anti theme`, threadID, messageID);
        writeFileSync(pathData, JSON.stringify(dataAnti, null, 4));
        break;
      }
      case "7": {
        const adminIDs = (await api.getThreadInfo(threadID)).adminIDs;
        if (!adminIDs.some(item => item.id === api.getCurrentUserID()))
          return api.sendMessage('❎ Bot cần quyền quản trị viên để có thể thực thi lệnh', threadID, messageID);

        const qtvData = dataAnti.antiQtv || {};
        if (!qtvData[threadID]) {
          qtvData[threadID] = true;
          api.sendMessage(`☑️ Bật thành công chế độ anti qtv`, threadID, messageID);
        } else {
          qtvData[threadID] = false;
          api.sendMessage(`☑️ Tắt thành công chế độ anti qtv`, threadID, messageID);
        }
        dataAnti.antiQtv = qtvData;
        writeFileSync(pathData, JSON.stringify(dataAnti, null, 4));
        break;
      }
      case "8": {
        const antijoin = dataAnti.antijoin || {};
        if (antijoin[threadID] === true) {
          antijoin[threadID] = false;
          api.sendMessage("☑️ Đã tắt thành công chế độ chống thêm thành viên", threadID, messageID);
        } else {
          antijoin[threadID] = true;
          api.sendMessage("☑️ Đã bật thành công chế độ chống thêm thành viên", threadID, messageID);
        }
        dataAnti.antijoin = antijoin;
        writeFileSync(pathData, JSON.stringify(dataAnti, null, 4));
        break;
      }
      case "9": {
        const antiImage = dataAnti.boximage.find(item => item.threadID === threadID);
        const antiBoxname = dataAnti.boxname.find(item => item.threadID === threadID);
        const antiNickname = dataAnti.antiNickname.find(item => item.threadID === threadID);
        const antiEmoji = dataAnti.antiEmoji && dataAnti.antiEmoji[threadID] ? dataAnti.antiEmoji[threadID].enabled : false;
        const antiTheme = dataAnti.antiTheme && dataAnti.antiTheme[threadID] ? dataAnti.antiTheme[threadID].enabled : false;
        const antiQtv = dataAnti.antiQtv && dataAnti.antiQtv[threadID] ? dataAnti.antiQtv[threadID] : false;
        const antiJoin = dataAnti.antijoin && dataAnti.antijoin[threadID] ? dataAnti.antijoin[threadID] : false;
        
        api.sendMessage(
          `|› 1. anti namebox: ${antiBoxname ? "bật" : "tắt"}\n|› 2. anti imagebox: ${antiImage ? "bật" : "tắt"}\n|› 3. anti nickname: ${antiNickname ? "bật" : "tắt"}\n|› 4. anti out: ${dataAnti.antiout[threadID] ? "bật" : "tắt"}\n|› 5. anti emoji: ${antiEmoji ? "bật" : "tắt"}\n|› 6. anti theme: ${antiTheme ? "bật" : "tắt"}\n|› 7. anti qtv: ${antiQtv ? "bật" : "tắt"}\n|› 8. anti join: ${antiJoin ? "bật" : "tắt"}\n────────────────────\n|› Trên kia là các trạng thái của từng anti`,
          threadID
        );
        break;
      }
      default: {
        return api.sendMessage(`❎ Số bạn chọn không có trong lệnh`, threadID);
      }
    }
  }
};
this.onRun = async ({ api, event, args, permssion, Threads }) => {
  const { threadID, messageID, senderID } = event;
  const threadSetting = (await Threads.getData(String(threadID))).data || {};
  const prefix = threadSetting.hasOwnProperty("PREFIX") ? threadSetting.PREFIX : global.config.PREFIX;
  return api.sendMessage(
    `╭─────────────⭓\n│ Anti Change Info Group\n├─────⭔\n│ 1. anti namebox: cấm đổi tên nhóm\n│ 2. anti boximage: cấm đổi ảnh nhóm\n│ 3. anti nickname: cấm đổi biệt danh người dùng\n│ 4. anti out: cấm thành viên out chùa\n│ 5. anti emoji: cấm thay đổi emoji nhóm\n│ 6. anti theme: cấm thay đổi chủ đề nhóm\n│ 7. anti qtv: cấm thay qtv nhóm (tránh bị cướp box)\n│ 8. anti join: cấm thêm thành viên mới vào nhóm\n│ 9. check trạng thái anti của nhóm\n├────────⭔\n│ 📌 Reply (phản hồi) theo stt để chọn chế độ mà bạn muốn thay đổi trạng thái\n╰─────────────⭓`,
    threadID,
    (error, info) => {
      if (error) {
        console.log(error);
        return api.sendMessage("❎ Đã xảy ra lỗi!", threadID);
      } else {
        global.Seiko.onReply.push({
          name: this.config.name,
          messageID: info.messageID,
          author: senderID,
          permssion
        });
      }
    }, messageID
  );
};