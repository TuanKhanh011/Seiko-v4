this.config = {
  name: "adc",
  aliases: ["adc"],
  version: "1.0.0",
  role: 3,
  author: "DongDev",
  info: "Áp dụng code all link raw",
  Category: "Admin",
  guides: "Thành viên không được dùng, đừng có mà tò mò",
  cd: 0,
  hasPrefix: true,
  images: []
};
const fs = require('fs');
const axios = require('axios');
const { join } = require('path');
this.onRun = async function({ api: a, event: e, args: r }) {
  const { threadID: t, messageID: m, messageReply: mr } = e;
  const n = r[0];
  let text = mr ? mr.body : null;
  if (!text && !n) {
    return a.sendMessage('⚠️ Vui lòng reply link muốn áp dụng code hoặc ghi tên file để up code lên Mocky!', t, m);
  }
  if (n && !text) {
    fs.readFile(join(__dirname, `${n}.js`), 'utf-8', async (err, data) => {
      if (err) {
        return a.sendMessage(`❎ Lệnh ${n} không tồn tại trên hệ thống!`, t, m);
      }
      try {
        const res = await axios.post('https://api.mocky.io/api/mock', {
          status: 200,
          content: data,
          content_type: 'application/json',
          charset: 'UTF-8',
          secret: 'PhamMinhDong',
          expiration: 'never'
        });
        return a.sendMessage(`☑️ Link Mocky: ${res.data.link}`, t, m);
      } catch (error) {
        return a.sendMessage('❎ Đã xảy ra lỗi khi upload code lên Mocky!', t, m);
      }
    });
    return;
  }
  const urlR = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;
  const url = text.match(urlR);
  if (url) {
    try {
      const res = await axios.get(url[0]);
      fs.writeFile(join(__dirname, `${n}.js`), res.data, 'utf-8', (err) => {
        if (err) {
          return a.sendMessage(`❎ Đã xảy ra lỗi khi áp dụng code vào ${n}.js`, t, m);
        }
        return a.sendMessage(`☑️ Đã áp dụng code vào ${n}.js, sử dụng load để cập nhật modules mới!`, t, m);
      });
    } catch (error) {
      return a.sendMessage('❎ Đã xảy ra lỗi khi tải dữ liệu từ URL!', t, m);
    }
    return;
  }
  return a.sendMessage('⚠️ Không nhận diện được yêu cầu của bạn. Vui lòng kiểm tra lại!', t, m);
};