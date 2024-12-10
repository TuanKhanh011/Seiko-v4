const crypto = require('crypto');
const os = require("os");
const axios = require("axios");
const fs = require("fs-extra");

module.exports.throwError = function (command, threadID, messageID) {
  const threadSetting = global.data.threadData.get(parseInt(threadID)) || {};
  return global.Seiko.api.sendMessage(
    `🔎 Lệnh sử dụng không hợp lệ\n📝 Dùng ${((threadSetting.hasOwnProperty("PREFIX")) ? threadSetting.PREFIX : global.config.PREFIX)}help ${command} để biết thêm chi tiết cách sử dụng lệnh`,
    threadID,
    messageID
  );
}

module.exports.cleanAnilistHTML = function (text) {
  return text
    .replace('<br>', '\n')
    .replace(/<\/?(i|em)>/g, '*')
    .replace(/<\/?b>/g, '**')
    .replace(/~!|!~/g, '||')
    .replace("&amp;", "&")
    .replace("&lt;", "<")
    .replace("&gt;", ">")
    .replace("&quot;", '"')
    .replace("&#039;", "'");
}

module.exports.getContent = async function(url) {
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (e) {
    console.log(e);
    return null;
  }
}

module.exports.randomString = function(length) {
  const characters = 'ABCDKCCzwKyY9rmBJGu48FrkNMro4AWtCkc1flmnopqrstuvwxyz';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

module.exports.AES = {
  encrypt (cryptKey, crpytIv, plainData) {
    const encipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(cryptKey), Buffer.from(crpytIv));
    let encrypted = encipher.update(plainData);
    encrypted = Buffer.concat([encrypted, encipher.final()]);
    return encrypted.toString('hex');
  },
  decrypt (cryptKey, cryptIv, encrypted) {
    encrypted = Buffer.from(encrypted, "hex");
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(cryptKey), Buffer.from(cryptIv));
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  },
  makeIv () {
    return crypto.randomBytes(16).toString('hex').slice(0, 16);
  }
}

module.exports.homeDir = function () {
  const home = process.env["HOME"];
  const user = process.env["LOGNAME"] || process.env["USER"] || process.env["LNAME"] || process.env["USERNAME"];
  let returnHome;

  switch (process.platform) {
    case "win32":
      returnHome = process.env.USERPROFILE || `${process.env.HOMEDRIVE}${process.env.HOMEPATH}` || home;
      break;
    case "darwin":
      returnHome = home || (user ? `/Users/${user}` : null);
      break;
    case "linux":
      returnHome = home || (process.getuid() === 0 ? '/root' : (user ? `/home/${user}` : null));
      break;
    default:
      returnHome = home;
  }

  return [typeof os.homedir === 'function' ? os.homedir() : returnHome, process.platform];
}

module.exports.msg = async function(api, event) {
    const sendMessageError = async (err) => {
        try {
            const errorMessage = err.stack ? err.stack : `${err.name || err.error}: ${err.message}`;
            await api.sendMessage(`Error occurred: ${errorMessage}`, event.threadID, event.messageID);
        } catch (error) {
            console.error("Error occurred while sending error message:", error);
        }
    }

    return {
        send: async (form, callback) => {
            try {
                await api.sendMessage(form, event.threadID, callback);
            } catch (err) {
                if (JSON.stringify(err).includes('spam')) {
                    throw err;
                } else {
                    await sendMessageError(err);
                }
            }
        },
        reply: async (form, callback) => {
            try {
                await api.sendMessage(form, event.threadID, callback, event.messageID);
            } catch (err) {
                if (JSON.stringify(err).includes('spam')) {
                    throw err;
                } else {
                    await sendMessageError(err);
                }
            }
        },
        unsend: async (messageID, callback) => {
            try {
                await api.unsendMessage(messageID, callback);
            } catch (err) {
                console.error("Error occurred while unsending message:", err);
            }
        },
        contact: async (form, callback) => {
            try {
                await api.shareContact(form, callback, event.threadID);
            } catch (err) {
                console.error("Error occurred while contact message:", err);
            }
        },
        edit: async (form, messageID) => {
            try {
                await api.editMessage(form || '', messageID);
            } catch (err) {
                console.error("Error occurred while editing message:", err);
            }
        },
        react: async (emoji, messageID, callback) => {
            try {
                await api.setMessageReaction(emoji, messageID, callback, true);
            } catch (err) {
                if (JSON.stringify(err).includes('spam')) {
                    throw err;
                } else {
                    await sendMessageError(err);
                }
            }
        },
        err: sendMessageError,
        error: sendMessageError
    };
};

module.exports.getExtFromMimeType = function(mimeType = "") {
  return mimeDB[mimeType] ? (mimeDB[mimeType].extensions || [])[0] || "unknown" : "unknown";
}

module.exports.getStreamFromURL = async function(url = "", pathName = "", options = {}) {
  if (!options && typeof pathName === "object") {
    options = pathName;
    pathName = "";
  }
  try {
    if (!url || typeof url !== "string")
      throw new Error(`The first argument (url) must be a string`);
    const response = await axios({
      url,
      method: "GET",
      responseType: "stream",
      ...options
    });
    if (!pathName) pathName = module.exports.randomString(10) + (response.headers["content-type"] ? '.' + module.exports.getExtFromMimeType(response.headers["content-type"]) : ".noext");
    response.data.path = pathName;
    return response.data;
  }
  catch (err) {
    throw err;
  }
}

module.exports.formatNumber = function(number) {
  if (isNaN(number)) throw new Error('The first argument (number) must be a number');
  return Number(number).toLocaleString("en-US");
}