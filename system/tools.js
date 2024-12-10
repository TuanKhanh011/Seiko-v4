const fs = require("fs");
const axios = require("axios");
const path = require('path');

module.exports.downloadFile = async (url, pathSave) => {
  const writer = fs.createWriteStream(pathSave);
  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream',
  });
  response.data.pipe(writer);
  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}

module.exports.randomString = function(length) {
	var result           = '';
	var characters       = 'ABCDKCCzwKyY9rmBJGu48FrkNMro4AWtCkc1flmnopqrstuvwxyz';
	var charactersLength = characters.length || 5;
	for ( var i = 0; i < length; i++ ) result += characters.charAt(Math.floor(Math.random() * charactersLength));
	return result;
}

module.exports.streamURL = async function(url, type) {
  return axios.get(url, {
    responseType: 'arraybuffer'
  }).then(res => {
    const path = process.cwd()+ `/srcipts/cmds/cache/${Date.now()}.${type}`;
    fs.writeFileSync(path, res.data);
    setTimeout(p => fs.unlinkSync(p), 1000 * 60, path);
    return fs.createReadStream(path);
  });
}

module.exports.convertHMS = function(value) {
    const sec = parseInt(value, 10); 
    let hours   = Math.floor(sec / 3600);
    let minutes = Math.floor((sec - (hours * 3600)) / 60); 
    let seconds = sec - (hours * 3600) - (minutes * 60); 
    if (hours   < 10) {hours   = "0"+hours;}
    if (minutes < 10) {minutes = "0"+minutes;}
    if (seconds < 10) {seconds = "0"+seconds;}
    return (hours != '00' ? hours +':': '') + minutes+':'+seconds;
};

module.exports.getGUID = function() {
  var sectionLength = Date.now();
  var id = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = Math.floor((sectionLength + Math.random() * 16) % 16);
    sectionLength = Math.floor(sectionLength / 16);
    var _guid = (c == "x" ? r : (r & 7) | 8).toString(16);
    return _guid;
  });
  return id;
};

module.exports.tiktokID = async function(url) {
    try {
        const response = await axios.get(url.replace("https://vm", "https://vt"), {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.0.0 Safari/537.36',
                'Referer': 'https://www.tiktok.com/'
            }
        });
        const ID = response.request.res.responseUrl.match(/\d{17,21}/g)?.[0];
        return ID ? ID : { status: "error", message: "Failed to fetch TikTok URL. Make sure your TikTok URL is correct!" };
    } catch (error) {
        return { status: "error", message: "An error occurred while fetching the TikTok ID." };
    }
}

module.exports.douyinID = async function(url) {
  try {
    const res = await axios.get(url);
    const match = /\/(\d*)\//.exec(res.request.path);
    if (match && match[1]) {
      return match[1];
    } else {
      throw new Error("Không thể trích xuất ID video");
    }
  } catch (error) {
    throw new Error("Error fetching video ID: " + error.message);
  }
}