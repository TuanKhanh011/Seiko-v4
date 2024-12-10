this.config = {
    name: "admin",
    aliases: ["adm", "ad"],
    version: "1.0.5",
    role: 0,
    author: "Mirai Team & Mod by DongDev",
    info: "Quản lý admin bot",
    Category: "Admin",
    guides: "[list/add/remove] [userID]",
    cd: 5,
    images: []
};
this.onLoad = function () {
    const { writeFileSync, existsSync } = require('fs-extra');
    const { resolve } = require("path");
    const path = resolve(process.cwd(), 'system', 'data', 'dataAdbox.json');
    if (!existsSync(path)) {
        const obj = {
            adminbox: {}
        };
        writeFileSync(path, JSON.stringify(obj, null, 4));
    } else {
        const data = require(path);
        if (!data.hasOwnProperty('adminbox')) data.adminbox = {};
        writeFileSync(path, JSON.stringify(data, null, 4));
    }
};
this.onReply = async function({ api, event, args, msg, onReply, Users }) {
    const fs = require('fs');
    if (onReply.type === 'adminList') {
        const l = global.config.NDH || [];
        if (!l.includes(event.senderID)) {
            return msg.reply("❎ Bạn không có quyền thực thi lệnh này");
        }
        const { configPath } = global.Seiko;
        var c = require(configPath);      
        const r = event.body.trim();
        const m = r.match(/^del\s+([\d\s,]+)$/i);
        if (m) {
            const i = m[1].split(/[\s,]+/).map(n => parseInt(n) - 1).filter(n => !isNaN(n) && n >= 0 && n < onReply.adm.length).sort((a, b) => b - a);
            if (i.length > 0) {
                const a = i.map(n => onReply.adm.splice(n, 1)[0]);
                const n = await Promise.all(a.map(async (id, idx) => {
                    const u = await Users.getData(id);
                    return `${i[idx] + 1}. ${u.name} (ID: ${id})`;
                }));
                msg.reply(`✅ Đã xóa các admin:\n\n${n.join(', ')}`);
                c.ADMINBOT = onReply.adm;
                fs.writeFileSync(configPath, JSON.stringify(c, null, 4), 'utf8');
                delete require.cache[require.resolve(configPath)];
            } else {
                msg.reply(`❎ Không tìm thấy admin với số thứ tự: ${r}`);
            }
        }
    }
};
this.onRun = async function ({ api, event, args, Users, msg, permssion }) {
    const content = args.slice(1, args.length);
    const { threadID, messageID, mentions, senderID } = event;
    const fs = require('fs');
    const { configPath } = global.Seiko;
    const { ADMINBOT, NDH } = global.config;
    const { writeFileSync } = require('fs-extra');
    const prefix = (global.data.threadData.get(threadID) || {}).PREFIX || global.config.PREFIX;
    const mention = Object.keys(mentions);
    const allowedUserIDs = global.config.NDH.map(id => id.toString());
    const senderIDStr = senderID.toString();
    delete require.cache[require.resolve(configPath)];
    var config = require(configPath);
    switch (args[0]) {
        case "list":
        case "l":
        case "-l": {
    const listAdmin = ADMINBOT || config.ADMINBOT || [];
    const listNDH = NDH || config.NDH || [];
    const listMsg = await Promise.all(listAdmin.map(async (idAdmin, index) => {
        if (parseInt(idAdmin)) {
            const userData = await Users.getData(idAdmin);
            const { name } = userData;
            return `${index + 1}. ${name}\n🔗 Link: fb.me/${idAdmin}`;
        }
    }));    
    msg.reply(`[ Người Điều Hành ]\n\n👤 Name: Lê Ngọc Khánh Băng\n🔗 Link: fb.me/lekhanhhihi\n📧 Email: lekhanhhihi@hotmail.com\n\n[ Admin Bot ]\n\n${listMsg.filter(Boolean).join('\n')}\n\n\n📌 Reply (phản hồi) del + stt để xóa admin trong danh sách`, (err, info) => {
            global.Seiko.onReply.push({
                name: this.config.name,
                messageID: info.messageID,
                author: event.senderID,
                adm: listAdmin,
                type: 'adminList'
            });
        });
    break;
}
       case "add": {
    const input = args.slice(1).join(' ');
    const id = Object.keys(event.mentions).length > 0 ? (Object.keys(event.mentions)[0]).replace(/\&mibextid=ZbWKwL/g, '') : (input !== void 0 ? (isNaN(input) ? await global.utils.getUID(input) : input) : (event.type == "message_reply" ? event.messageReply.senderID : event.senderID));

    if (!allowedUserIDs.includes(senderIDStr)) {
       return msg.reply(`❎ Cần quyền admin chính để thực hiện lệnh`);
    }
    if (event.type === "message_reply") {
        content[0] = event.messageReply.senderID;
    }   
    if ((mention.length !== 0 || !isNaN(content[0])) && !isNaN(id)) {
        const targetID = mention.length !== 0 ? mention[0] : content[0];
        ADMINBOT.push(targetID);
        config.ADMINBOT.push(targetID);
        const name = (await Users.getData(targetID)).name;
        writeFileSync(configPath, JSON.stringify(config, null, 4), 'utf8');
        return msg.reply(`[ ADD NEW ADMIN ] \n\n✅ Đã thêm 1 người dùng trở thành admin bot:\n\n👤 Name: ${name}\n🔗 Link: fb.me/${targetID}`, threadID, messageID);
    } else {
        return global.utils.throwError(this.config.name, threadID, messageID);
    }
}
 
case "remove":
case "rm":
case "delete": {
    const input = args.slice(1).join(' ');
    const id = Object.keys(event.mentions).length > 0 ? (Object.keys(event.mentions)[0]).replace(/\&mibextid=ZbWKwL/g, '') : (input !== void 0 ? (isNaN(input) ? await global.utils.getUID(input) : input) : (event.type == "message_reply" ? event.messageReply.senderID : event.senderID));

    if (!allowedUserIDs.includes(senderIDStr)) {
       return msg.reply(`❎ Cần quyền admin chính để thực hiện lệnh`);
    }
    if (event.type === "message_reply") { 
        content[0] = event.messageReply.senderID;
    }
    
    if ((mentions.length !== 0 || !isNaN(content[0])) && !isNaN(id)) {
        const targetID = mentions.length !== 0 ? mentions[0] : content[0];
        const index = config.ADMINBOT.findIndex(item => item.toString() === targetID);
        
        if (index !== -1) {
            ADMINBOT.splice(index, 1);
            config.ADMINBOT.splice(index, 1);
            const userData = await Users.getData(targetID);
            const name = userData.name;
            writeFileSync(configPath, JSON.stringify(config, null, 4), 'utf8');
            return msg.reply(`[ REMOVE ADMIN ]\n\n✅ Đã gỡ 1 admin trở lại làm thành viên:\n\n👤 Name: ${name}\n🔗 Link: fb.me/${targetID}`);
        } else {
            return msg.reply(`❎ Người dùng không phải là admin`);
        }
    } else {
      return global.utils.throwError(this.config.name, threadID, messageID);
    }
}

        case 'box':
        case 'qtvonly': {
            const { resolve } = require("path");
            const pathData = resolve(process.cwd(), 'system', 'data', 'dataAdbox.json');
            const database = require(pathData);
            const { adminbox } = database;
            if (permssion < 1) return msg.reply("⚠️ Cần quyền quản trị viên để thực hiện lệnh");
            if (adminbox[threadID] == true) {
                adminbox[threadID] = false;
                msg.reply("☑️ Tắt chế độ quản trị viên, tất cả thành viên có thể sử dụng bot");
            } else {
                adminbox[threadID] = true;
                msg.reply("☑️ Kích hoạt chế độ quản trị viên, chỉ quản trị viên mới có thể sử dụng bot");
            }
            writeFileSync(pathData, JSON.stringify(database, null, 4));
            break;
        }
        case 'only':
        case '-o': {
            if (permssion != 3) return msg.reply("❎ Bạn không có quyền sử dụng lệnh này");
            if (config.adminOnly == false) {
                config.adminOnly = true;
                api.sendMessage("➝ 𝐌𝐎𝐃𝐄 • • 𝙾𝙽 𝙰𝙳𝙼𝙸𝙽 𝙾𝙽𝙻𝚈", threadID, messageID);
            } else {
                config.adminOnly = false;
                api.sendMessage("➝ 𝐌𝐎𝐃𝐄 • • 𝙾𝙵𝙵 𝙰𝙳𝙼𝙸𝙽 𝙾𝙽𝙻𝚈", threadID, messageID);
            }
            writeFileSync(configPath, JSON.stringify(config, null, 4), 'utf8');
            break;
        }
         case 'ping': {
          const timeStart = event.timestamp;
          const pingrs = Date.now() - timeStart;
           msg.reply(`📶 Ping phản hồi: ${pingrs} ms`);
           break;
        }
        case 'echo': {
      const input = args.join(" ");
      const spaceIndex = input.indexOf(' ');

      if (spaceIndex !== -1) {
        const textAfterFirstWord = input.substring(spaceIndex + 1).trim();
        return api.sendMessage(textAfterFirstWord, event.threadID);
      }
      break;
    }
        case 'offbot': {
          if (!allowedUserIDs.includes(senderIDStr)) {
           return msg.reply(`❎ Cần quyền admin chính để thực hiện lệnh`);
        }
         msg.reply("☠️ Pái pai", () => process.exit(0))
         break;
        }
        case 'del': {
        if (!allowedUserIDs.includes(senderIDStr)) {
           return msg.reply(`❎ Cần quyền admin chính để thực hiện lệnh`);
        }
        const cmdname = args.slice(1).join(' ');
        if (!cmdname) return msg.reply(`⚠️ Vui lòng cung cấp tên lệnh cần xoá`);
        const filePath = `${__dirname}/${cmdname}.js`;
        fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            return msg.reply(`❎ Lệnh ${cmdname} không tồn tại`);
        }
          fs.unlink(filePath, (err) => {
              if (err) return msg.reply(`❎ Xoá file ${cmdname}.js thất bại: ${err.message}`);
              return msg.reply(`☑️ Đã xoá file ${cmdname}.js thành công`);
            });
        });
        break;
        }
        case 'shell': {
          const { exec } = require("child_process");
          const text = args.slice(1).join(' ');
          exec(`${text}`, { shell: true }, (error, stdout, stderr) => {
          if (error) {
              msg.reply(`${error.message}`);
            return;
          }
          if (stderr) {
               msg.reply(`${stderr}`);
               return;
          }
          msg.reply(`${stdout}`);
        });
        break;
        }
      case 'create': {
  if (!allowedUserIDs.includes(senderIDStr)) {
    return api.sendMessage(`⚠️ Cần quyền admin chính để thực hiện lệnh`, event.threadID, event.messageID);
  }

  if (args.slice(1).length === 0) {
    return api.sendMessage("⚠️ Vui lòng đặt tên cho file của bạn", event.threadID);
  }

  const commandName = args.slice(1).join(' ');
  const filePath = `${__dirname}/${commandName}.js`;

  if (fs.existsSync(filePath)) {
    return api.sendMessage(`⚠️ File ${commandName}.js đã tồn tại từ trước`, event.threadID, event.messageID);
  }

  try {
    fs.copyFileSync(`${__dirname}/example.js`, filePath);
    api.sendMessage(`☑️ Đã tạo thành công file "${commandName}.js"`, event.threadID, event.messageID);
  } catch (error) {
    console.error('Lỗi khi tạo file:', error);
    api.sendMessage(`⚠️ Đã xảy ra lỗi khi tạo file`, event.threadID, event.messageID);
  }
  break;
}

        
        // Các trường hợp khác
        default: {
            return msg.reply(`[ ADMIN CONFIG SETTING ]\n──────────────────\n${prefix}admin add: thêm người dùng làm admin\n${prefix}admin remove: gỡ vai trò admin\n${prefix}admin list: xem danh sách admin\n${prefix}admin qtvonly: bật/tắt chế độ quản trị viên\n${prefix}admin chat: bật/tắt chế độ chat riêng\n${prefix}admin echo: bot sẽ trả về câu mà bạn nói\n${prefix}admin fast: xem tốc độ mạng của bot\n${prefix}admin create [tên mdl]: tạo file mới trong commands\n${prefix}admin del [tên mdl]: xoá file trong commands\n${prefix}admin shell [input]: Running shell\n──────────────────\n📝 HDSD: ${prefix}admin + [text] lệnh cần dùng`);
        }
    };
};