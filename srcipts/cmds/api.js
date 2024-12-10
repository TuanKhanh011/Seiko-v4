const fs = require('fs');
const path = require('path');
const axios = require('axios');
this.config = {
  name: "api",
  aliases: ["api"],
  version: "3.0.0",
  role: 3,
  author: "DongDev",
  info: "Tải link/quản lý link ảnh/video/nhạc ở kho lưu trữ link",
  Category: "Admin",
  guides: "[]",
  cd: 5,
  hasPrefix: true,
  images: [],
};
this.onRun = async ({ api, event, args, msg }) => {
  try {
    const projectHome = path.resolve('./');
    const srcapi = path.join(projectHome, 'system/data/media');
    global.srcapi = srcapi;
    switch (args[0]) {
      case 'add': {
        if (args.length === 1) return api.sendMessage("⚠️ Vui lòng nhập tên tệp", event.threadID, event.messageID);
        const t = args[1];
        const p = path.join(srcapi, `${t}.json`);
        if (!fs.existsSync(p)) fs.writeFileSync(p, '[]', 'utf-8');
        const d = JSON.parse(fs.readFileSync(p, 'utf-8'));
        if (!event.messageReply || !event.messageReply.attachments.length) {
          return api.sendMessage("❎ Không tìm thấy tệp đính kèm hợp lệ để tải lên!", event.threadID, event.messageID);
        }
        const l = event.messageReply.attachments.map(a => a.url);
        if (!l.length) return api.sendMessage("❎ Không tìm thấy URL hợp lệ để tải lên!", event.threadID, event.messageID);
        try {
          const u = await Promise.all(l.map(async link => await global.api.catbox(link)));
          d.push(...u);
          fs.writeFileSync(p, JSON.stringify(d, null, 2), 'utf-8');
          api.sendMessage(`✅ Uploaded link successfully`, event.threadID, event.messageID);
        } catch (error) {
          console.error("Error:", error);
          api.sendMessage("❎ Lỗi khi tải lên!", event.threadID, event.messageID);
        }
        break;
      }
      case 'check': {
        const files = fs.readdirSync(srcapi);
        let fileIndex = 1;
        let totalLinks = 0;
        const results = [];
        for (const file of files) {
          const filePath = path.join(srcapi, file);
          const fileContent = fs.readFileSync(filePath, 'utf8');
          const linksArray = JSON.parse(fileContent);
          totalLinks += linksArray.length;
          results.push(`${fileIndex}. ${file} - tổng ${linksArray.length} link`);
          fileIndex++;
        }
        msg.reply(`${results.join('\n')}\n\n⩺ Tổng tất cả link: ${totalLinks}\n⩺ Reply [ del | rename | share ] + stt`, (error, info) => {
          if (!error) {
            global.Seiko.onReply.push({
              type: "choosee",
              name: module.exports.config.name,
              author: info.senderID,
              messageID: info.messageID,
              dataaa: files,
            });
          }
        });
        break;
      }
      case 'create':
      case 'cr': {
        if (args.length === 1) return api.sendMessage("⚠️ Vui lòng nhập tên tệp", event.threadID, event.messageID);
        const t = args[1];
        const p = path.join(srcapi, `${t}.json`);
        if (fs.existsSync(p)) return api.sendMessage("❎ File đã tồn tại!", event.threadID, event.messageID);
        fs.writeFileSync(p, '[]', 'utf-8');
        api.sendMessage(`✅ Tạo file ${t}.json thành công`, event.threadID, event.messageID);
        break;
      }
      case 'checklink': {
        if (args.length === 1) return api.sendMessage("⚠️ Vui lòng nhập tên tệp", event.threadID, event.messageID);
        const t = args[1];
        const p = path.join(srcapi, `${t}.json`);
        if (!fs.existsSync(p)) return api.sendMessage("❎ File không tồn tại!", event.threadID, event.messageID);
        
        const fileContent = fs.readFileSync(p, 'utf8');
        const linksArray = JSON.parse(fileContent);
        let liveCount = 0;
        let deadCount = 0;
        const checkLinkPromises = linksArray.map(async link => {
          try {
            const response = await axios.head(link);
            if (response.status === 200) {
              liveCount++;
            } else {
              deadCount++;
            }
          } catch (error) {
            deadCount++;
          }
        });
        await Promise.all(checkLinkPromises);
        api.sendMessage(`📄 File ${t}.json:\n✅ Live: ${liveCount}\n❎ Dead: ${deadCount}`, event.threadID, event.messageID);
        break;
      }
      case 'search': {
        if (args.length < 3) return api.sendMessage("⚠️ Vui lòng nhập tên tệp và từ khóa tìm kiếm", event.threadID, event.messageID);
        const t = args[1];
        const keyword = args.slice(2).join(' ');
        const p = path.join(srcapi, `${t}.json`);
        if (!fs.existsSync(p)) return api.sendMessage("❎ File không tồn tại!", event.threadID, event.messageID);

        const fileContent = fs.readFileSync(p, 'utf8');
        const linksArray = JSON.parse(fileContent);
        const matchingLinks = linksArray.filter(link => link.includes(keyword));
        api.sendMessage(`🔍 Tìm thấy ${matchingLinks.length} link:\n${matchingLinks.join('\n')}`, event.threadID, event.messageID);
        break;
      }
      case 'export': {
        if (args.length === 1) return api.sendMessage("⚠️ Vui lòng nhập tên tệp", event.threadID, event.messageID);
        const t = args[1];
        const format = args[2] || 'txt';
        const p = path.join(srcapi, `${t}.json`);
        if (!fs.existsSync(p)) return api.sendMessage("❎ File không tồn tại!", event.threadID, event.messageID);

        const fileContent = fs.readFileSync(p, 'utf8');
        const linksArray = JSON.parse(fileContent);

        const tempFilePath = path.join(srcapi, `${t}.${format}`);
        if (format === 'csv') {
          const csvContent = linksArray.join('\n');
          fs.writeFileSync(tempFilePath, csvContent, 'utf8');
        } else {
          fs.writeFileSync(tempFilePath, fileContent, 'utf8');
        }
        api.sendMessage({
          body: `📄 Đây là nội dung của file ${t} trong định dạng ${format}:`,
          attachment: fs.createReadStream(tempFilePath)
        }, event.threadID, () => {
          fs.unlinkSync(tempFilePath);
        });
        break;
      }
      case 'filter': {
        if (args.length < 3) return api.sendMessage("⚠️ Vui lòng nhập tên tệp và loại nội dung (image/video/music)", event.threadID, event.messageID);
        const t = args[1];
        const type = args[2];
        const p = path.join(srcapi, `${t}.json`);
        if (!fs.existsSync(p)) return api.sendMessage("❎ File không tồn tại!", event.threadID, event.messageID);

        const fileContent = fs.readFileSync(p, 'utf8');
        const linksArray = JSON.parse(fileContent);
        const filteredLinks = linksArray.filter(link => {
          if (type === 'image') return /\.(jpg|jpeg|png|gif)$/.test(link);
          if (type === 'video') return /\.(mp4|avi|mkv)$/.test(link);
          if (type === 'music') return /\.(mp3|wav|flac)$/.test(link);
          return false;
        });
        api.sendMessage(`📁 Có ${filteredLinks.length} link thuộc loại ${type}:\n${filteredLinks.join('\n')}`, event.threadID, event.messageID);
        break;
      }
      case 'edit': {
        if (args.length < 4) return api.sendMessage("⚠️ Vui lòng nhập tên tệp, vị trí link và link mới", event.threadID, event.messageID);
        const t = args[1];
        const index = parseInt(args[2]);
        const newLink = args[3];
        const p = path.join(srcapi, `${t}.json`);
        if (!fs.existsSync(p)) return api.sendMessage("❎ File không tồn tại!", event.threadID, event.messageID);

        const fileContent = fs.readFileSync(p, 'utf8');
        const linksArray = JSON.parse(fileContent);
        if (index < 0 || index >= linksArray.length) return api.sendMessage("❎ Vị trí không hợp lệ!", event.threadID, event.messageID);

        linksArray[index] = newLink;
        fs.writeFileSync(p, JSON.stringify(linksArray, null, 2), 'utf-8');
        api.sendMessage(`✏️ Đã sửa link ở vị trí ${index + 1}`, event.threadID, event.messageID);
        break;
      }
      case 'remove': {
        if (args.length < 3) return api.sendMessage("⚠️ Vui lòng nhập tên tệp và vị trí cần xóa", event.threadID, event.messageID);
        const t = args[1];
        const index = parseInt(args[2]);
        const p = path.join(srcapi, `${t}.json`);
        if (!fs.existsSync(p)) return api.sendMessage("❎ File không tồn tại!", event.threadID, event.messageID);

        const fileContent = fs.readFileSync(p, 'utf8');
        const linksArray = JSON.parse(fileContent);
        if (index < 0 || index >= linksArray.length) return api.sendMessage("❎ Vị trí không hợp lệ!", event.threadID, event.messageID);

        linksArray.splice(index, 1);
        fs.writeFileSync(p, JSON.stringify(linksArray, null, 2), 'utf-8');
        api.sendMessage(`🗑️ Đã xóa link ở vị trí ${index + 1}`, event.threadID, event.messageID);
        break;
      }
      default:
        api.sendMessage("📝 Sử dụng add, check, create, checklink, search, export, filter, edit, remove hoặc del", event.threadID, event.messageID);
    }
  } catch (error) {
    console.log(error);
    api.sendMessage(`❎ Đã xảy ra lỗi trong quá trình thực hiện lệnh: ${error}`, event.threadID, event.messageID);
  }
};

this.onReply = async function ({ event, api, onReply }) {
  const { threadID: tid, messageID: mid, body } = event;
  const args = body.split(" ");
  switch (onReply.type) {
    case 'choosee':
      const choose = parseInt(body);
      api.unsendMessage(onReply.messageID);
      if (!isNaN(choose)) {
        const selectedFile = onReply.dataaa[choose - 1];
        if (!selectedFile) {
          return api.sendMessage('❎ Lựa chọn không nằm trong danh sách!', tid, mid);
        }
        const filePath = path.join(global.srcapi, selectedFile);
        try {
          const fileContent = fs.readFileSync(filePath, 'utf8');
          const linksArray = JSON.parse(fileContent);
          let liveCount = 0;
          let deadCount = 0;
          const chunkSize = 10;
          const linkChunks = [];
          for (let i = 0; i < linksArray.length; i += chunkSize) {
            linkChunks.push(linksArray.slice(i, i + chunkSize));
          }
          const checkLinkPromises = linkChunks.map(async chunk => {
            await Promise.all(chunk.map(async link => {
              try {
                const response = await axios.head(link);
                if (response.status === 200) {
                  liveCount++;
                } else {
                  deadCount++;
                }
              } catch (error) {
                deadCount++;
              }
            }));
          });
          await Promise.all(checkLinkPromises);
          if (deadCount === 0) {
            return api.sendMessage(`✅ File ${selectedFile} không có liên kết nào die!`, tid, mid);
          }
          api.sendMessage(`|› 🗂️ Name file: ${selectedFile}\n|› 📝 Total: ${linksArray.length}\n|› ✅ Live: ${liveCount}\n|› ❎ Die: ${deadCount}\n\n──────────────────\n|› 📌 Thả cảm xúc '👍' để lọc link die\n|› ✏️ Lưu ý, trong quá trình lọc vẫn sẽ có sự khác biệt về số lượng link die so với khi check`, tid, async (error, info) => {
            if (!error) {
              global.Seiko.onReaction.push({
                name: module.exports.config.name,
                messageID: info.messageID,
                author: event.senderID,
                selectedFile: selectedFile
              });
            }
          });
        } catch (error) {
          console.log(error);
          api.sendMessage(`❎ Đã xảy ra lỗi trong quá trình kiểm tra file: ${error}`, tid, mid);
        }
      } else if (args[0] === 'del' && !isNaN(parseInt(args[1]))) {
        try {
          const selectedFileIndex = parseInt(args[1]) - 1;
          const files = onReply.dataaa;
          if (selectedFileIndex < 0 || selectedFileIndex >= files.length) {
            return api.sendMessage('❎ Lựa chọn không hợp lệ', tid, mid);
          }
          const selectedFile = files[selectedFileIndex];
          const filePath = path.join(global.srcapi, selectedFile);
          fs.unlinkSync(filePath);
          api.sendMessage(`✅ Đã xóa file ${selectedFile} thành công!`, tid, mid);
        } catch (error) {
          console.log(error);
          api.sendMessage(`❎ Đã xảy ra lỗi khi xóa file: ${error}`, tid, mid);
        }
      } else if (args[0] === 'rename' && !isNaN(parseInt(args[1])) && args[2]) {
        try {
          const selectedFileIndex = parseInt(args[1]) - 1;
          const newName = args.slice(2).join(' ').trim() + '.json';
          const files = onReply.dataaa;

          if (selectedFileIndex < 0 || selectedFileIndex >= files.length) {
            return api.sendMessage('❎ Lựa chọn không hợp lệ', tid, mid);
          }
          const selectedFile = files[selectedFileIndex];
          const oldPath = path.join(global.srcapi, selectedFile);
          const newPath = path.join(global.srcapi, newName);
          fs.renameSync(oldPath, newPath);
          api.sendMessage(`✅ Đổi tên file từ ${selectedFile} thành ${newName} thành công!`, tid, mid);
        } catch (error) {
          console.log(error);
          api.sendMessage(`❎ Đã xảy ra lỗi khi đổi tên file: ${error}`, tid, mid);
        }
      } else if (args[0] === 'share' && !isNaN(parseInt(args[1]))) {
        try {
          const selectedFileIndex = parseInt(args[1]) - 1;
          const files = onReply.dataaa;
          if (selectedFileIndex < 0 || selectedFileIndex >= files.length) {
            return api.sendMessage('❎ Lựa chọn không hợp lệ', tid, mid);
          }
          const selectedFile = files[selectedFileIndex];
          const filePath = path.join(global.srcapi, selectedFile);
          const fileContent = fs.readFileSync(filePath, 'utf8');
          const tempTxtPath = path.join(global.srcapi, `${path.basename(selectedFile, '.json')}.txt`);
          fs.writeFileSync(tempTxtPath, fileContent, 'utf8');
          api.sendMessage({
            body: `📄 Đây là nội dung của file ${selectedFile}:`,
            attachment: fs.createReadStream(tempTxtPath)
          }, tid, () => {
            fs.unlinkSync(tempTxtPath);
          });
        } catch (error) {
          console.log(error);
          api.sendMessage(`❎ Đã xảy ra lỗi khi chia sẻ file: ${error}`, tid, mid);
        }
      } else {
        api.sendMessage("❎ Bạn không phải người dùng lệnh, vui lòng không thực hiện hành động này", tid, mid);
      }
      break;
  }
};

this.onReaction = async ({ api, event, onReaction }) => {
  const { messageID, selectedFile } = onReaction;
  const { threadID } = event;
  if (event.reaction == '👍') {
    try {
      api.unsendMessage(onReaction.messageID);
      const filePath = path.join(global.srcapi, selectedFile);
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const linksArray = JSON.parse(fileContent);
      let liveLinks = [];
      let deadLinks = [];
      const chunkSize = 10;
      const linkChunks = [];
      for (let i = 0; i < linksArray.length; i += chunkSize) {
        linkChunks.push(linksArray.slice(i, i + chunkSize));
      }
      const checkLinkPromises = linkChunks.map(async chunk => {
        await Promise.all(chunk.map(async link => {
          try {
            const response = await axios.head(link);
            if (response.status === 200) {
              liveLinks.push(link);
            } else {
              deadLinks.push(link);
            }
          } catch (error) {
            deadLinks.push(link);
          }
        }));
      });
      await Promise.all(checkLinkPromises);
      fs.writeFileSync(filePath, JSON.stringify(liveLinks, null, 2), 'utf8');
      api.sendMessage(`✅ Đã lọc link die thành công, hiện có ${liveLinks.length} link sống trong file ${selectedFile}`, threadID);
    } catch (error) {
      console.log(error);
      api.sendMessage(`❎ Đã xảy ra lỗi khi lọc link die: ${error}`, threadID);
    }
  }
};