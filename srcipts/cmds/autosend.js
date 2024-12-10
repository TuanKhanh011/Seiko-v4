const fs = require('fs');
const moment = require('moment-timezone');
const axios = require('axios');

this.config = {
  name: 'autosend',
  aliases: ["autosend"],
  version: '1.0.4',
  role: 3,
  author: 'DongDev',
  info: 'Tự động gửi tin nhắn theo giờ đã cài!',
  Category: 'Hệ thống',
  guides: "add <thời gian> <nội dung tin nhắn>\n" +
          "remove <thời gian>\n" +
          "list\n" + 
          "update <thời gian> <nội dung mới>\n" +
          "off <thời gian> | off all\n",
  cd: 3,
  hasPrefix: true,
  images: [],
};

const filePath = __dirname + '/../../system/data/data_autosend.json';
function readScheduleFromFile() {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, '[]', 'utf8');
    }
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    console.error('Error loading schedule from file:', err);
    return [];
  }
}
function writeScheduleToFile(schedule) {
  fs.writeFileSync(filePath, JSON.stringify(schedule, null, 2), 'utf8');
  delete require.cache[require.resolve(filePath)];
}
function getRandomMessage(messages) {
  return messages[Math.floor(Math.random() * messages.length)];
}
async function getImageStream(file) {
  try {
    const jsonPath = __dirname + `/../../system/data/media/${file}.json`;
    if (!fs.existsSync(jsonPath)) throw new Error('File không tồn tại');
    const links = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    const link = links[Math.floor(Math.random() * links.length)];
    const response = await axios.get(link, { responseType: 'stream' });
    return response.data;
  } catch (error) {
    console.error('Error loading image:', error);
    return null;
  }
}
function calculateNextRunTime(interval) {
  const now = moment().tz('Asia/Ho_Chi_Minh');
  const [value, unit] = interval.split('-')[1].match(/(\d+)([hm])/).slice(1);
  const duration = moment.duration(parseInt(value), unit === 'h' ? 'hours' : 'minutes');
  return now.add(duration).format('HH:mm:ss');
}
function shouldSendMessage(lastSentTime, interval) {
  const now = moment().tz('Asia/Ho_Chi_Minh');
  const [value, unit] = interval.split('-')[1].match(/(\d+)([hm])/).slice(1);
  const duration = moment.duration(parseInt(value), unit === 'h' ? 'hours' : 'minutes');
  const nextSendTime = moment(lastSentTime).add(duration);
  return now.isSameOrAfter(nextSendTime);
}
this.onLoad = function (o) {
  setInterval(async () => {
    const sch = readScheduleFromFile();
    const currTime = moment().tz('Asia/Ho_Chi_Minh').format('HH:mm:ss');
    for (const e of sch) {
      if (e.disabled) continue;
      const sendToAllThreads = async (msgOpts) => {
        const sendPromises = global.data.allThreadID.map((id) => o.api.sendMessage(msgOpts, id));
        await Promise.all(sendPromises);
      };
      if (e.timer.startsWith('interval')) {
        if (e.lastSentTime && !shouldSendMessage(e.lastSentTime, e.timer)) continue;
        const msg = getRandomMessage(e.message);
        const msgOpts = { body: msg };
        if (e.type !== 's') {
          const attach = await getImageStream(e.type);
          if (attach) msgOpts.attachment = attach;
        }
        await sendToAllThreads(msgOpts);
        e.lastSentTime = moment().tz('Asia/Ho_Chi_Minh').format();
        writeScheduleToFile(sch);
      } else if (e.timer === currTime) {
        const msg = getRandomMessage(e.message);
        const msgOpts = { body: msg };
        if (e.type !== 's') {
          const attach = await getImageStream(e.type);
          if (attach) msgOpts.attachment = attach;
        }
        await sendToAllThreads(msgOpts);
      }
    }
  }, 1000);
};

this.onRun = async function ({ event, api, args, msg }) {
  const command = args[0];
  const timer = args[1];
  const message = args.slice(2).join(' ');
  const schedule = readScheduleFromFile();
  switch (command) {
    case 'set':
    case 'add':
      if (!timer || !message) return msg.reply('❎ Vui lòng cung cấp đầy đủ thời gian và tin nhắn');
      schedule.push({ timer, message: [message], type: '', lastSentTime: null, disabled: false });
      writeScheduleToFile(schedule);
      msg.reply(`✅ Đã thêm autosend mới:\n⏰ Thời gian: ${timer}\n📝 Nội dung: ${message}\nVui lòng reply tin nhắn này để nhập loại hình ảnh (vdgai, girl) hoặc trả lời 's' nếu không muốn gửi kèm hình ảnh`, (err, info) => {
        global.Seiko.onReply.push({
          name: this.config.name,
          messageID: info.messageID,
          author: event.senderID,
          type: 'add',
          timer: timer
        });
      });
      break;
    case 'del':
    case 'remove':
      if (!timer) return msg.reply('❎ Vui lòng cung cấp thời gian cần xoá');
      const removeIndex = schedule.findIndex(i => i.timer === timer);
      if (removeIndex !== -1) {
        schedule.splice(removeIndex, 1);
        writeScheduleToFile(schedule);
        api.sendMessage(`✅ Đã xoá autosend có thời gian: ${timer}`, event.threadID);
      } else {
        msg.reply(`❎ Không tìm thấy autosend nào có thời gian: ${timer}`);
      }
      break;
    case 'off':
      if (timer === 'all') {
        for (const entry of schedule) {
          entry.disabled = true;
        }
        writeScheduleToFile(schedule);
        msg.reply('✅ Đã tắt tất cả các autosend.');
      } else {
        const entryIndex = schedule.findIndex(i => i.timer === timer);
        if (entryIndex !== -1) {
          schedule[entryIndex].disabled = true;
          writeScheduleToFile(schedule);
          msg.reply(`✅ Đã tắt autosend có thời gian: ${timer}`);
        } else {
          msg.reply(`❎ Không tìm thấy autosend nào có thời gian: ${timer}`);
        }
      }
      break;
    case '-l':
    case 'list':
      const response = '📝 Danh sách autosend:\n' + schedule.map(entry => `${entry.disabled ? '❌' : '✅'} ${entry.timer}: ${entry.message.join(' ')}${entry.type ? ` 📷 ${entry.type}` : ''}`).join('\n');
      msg.reply(response);
      break;
    case 'up':
    case 'update':
      if (!timer || !message) return msg.reply('❎ Vui lòng cung cấp thời gian và nội dung mới');
      const updateIndex = schedule.findIndex(i => i.timer === timer);
      if (updateIndex !== -1) {
        schedule[updateIndex].message = [message];
        writeScheduleToFile(schedule);
        msg.reply(`✅ Đã cập nhật autosend có thời gian: ${timer}\n📝 Nội dung mới: ${message}\nVui lòng reply tin nhắn này để nhập loại hình ảnh (vdgai, girl) hoặc trả lời 's' nếu không muốn gửi kèm hình ảnh`, (err, info) => {
          global.Seiko.onReply.push({
            name: this.config.name,
            messageID: info.messageID,
            author: event.senderID,
            type: 'update',
            timer: timer
          });
        });
      } else {
        msg.reply(`❎ Không tìm thấy autosend nào có thời gian: ${timer}`);
      }
      break;
    case '-h':
    case 'help':
      msg.reply(`
        - Để thêm tin nhắn tự động với thời gian cụ thể: autosend add <thời gian> <nội dung tin nhắn>
        - Để xoá tin nhắn tự động: autosend remove <thời gian>
        - Để liệt kê danh sách tin nhắn tự động: autosend list
        - Để cập nhật tin nhắn tự động: autosend update <thời gian> <nội dung mới>
        - Để tắt tin nhắn tự động: autosend off <thời gian> (hoặc 'all' để tắt tất cả)
      `);
      break;

    default:
      msg.reply('❎ Vui lòng sử dụng: add, remove, list, update, off, help');
  }
};

this.onReply = async function ({ event, api, onReply }) {
  const { author, name, messageID, timer, type } = onReply;
  if (event.senderID !== author) return;
  const input = event.body.trim();
  const validTypes = ['vdgai', 'girl', 's'];
  if (!validTypes.includes(input)) {
    return api.sendMessage('❎ Vui lòng nhập loại hình ảnh hợp lệ (vdgai, girl) hoặc trả lời "s" nếu không muốn gửi kèm hình ảnh', event.threadID);
  }
  const schedule = readScheduleFromFile();
  const entryIndex = schedule.findIndex(i => i.timer === timer);
  if (entryIndex !== -1) {
    schedule[entryIndex].type = input;
    writeScheduleToFile(schedule);
    const attachmentStatus = input === 's' ? 'không' : `có (${input})`;
    const entry = schedule[entryIndex];
    api.sendMessage(`✅ Đã cập nhật autosend:\n⏰ Thời gian: ${entry.timer}\n📝 Nội dung: ${entry.message.join(' ')}\n📷 Attachment: ${attachmentStatus}`, event.threadID);
  } else {
    api.sendMessage('❎ Không tìm thấy autosend nào', event.threadID);
  }
};