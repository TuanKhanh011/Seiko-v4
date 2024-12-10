const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { loadImage, createCanvas, registerFont } = require('canvas');
const Jimp = require('jimp');

const circleImage = async (image) => {
    image = await Jimp.read(image);
    image.circle();
    return await image.getBufferAsync("image/png");
};

async function v1(options) {
    const { name, color = 'no', address, email, subname, phoneNumber, uid } = options;    
    if (!address || !name || !email || !subname || !phoneNumber || !uid) {
        throw new Error('Missing data to execute the command');
     }
     const cacheDir = path.resolve(process.cwd(), "srcipts", "cmds", "cache");
     const pathImg = path.join(cacheDir, 'fbcover1.png');
     const pathAva = path.join(cacheDir, 'fbcover2.png');
     const pathLine = path.join(cacheDir, 'fbcover3.png');
     if (!fs.existsSync(cacheDir)) {
          fs.mkdirSync(cacheDir);
      }
      const avtAnime = (await axios.get(`https://graph.facebook.com/${uid}/picture?height=1500&width=1500&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, { responseType: "arraybuffer" })).data;
      const background = (await axios.get(`https://1.bp.blogspot.com/-ZyXHJE2S3ew/YSdA8Guah-I/AAAAAAAAwtQ/udZEj3sXhQkwh5Qn8jwfjRwesrGoY90cwCNcBGAsYHQ/s0/bg.jpg`, { responseType: "arraybuffer" })).data;
      const hieuung = (await axios.get(`https://1.bp.blogspot.com/-zl3qntcfDhY/YSdEQNehJJI/AAAAAAAAwtY/C17yMRMBjGstL_Cq6STfSYyBy-mwjkdQwCNcBGAsYHQ/s0/mask.png`, { responseType: "arraybuffer" })).data;
      fs.writeFileSync(pathAva, Buffer.from(avtAnime));
      fs.writeFileSync(pathImg, Buffer.from(background));
      fs.writeFileSync(pathLine, Buffer.from(hieuung));
      const avatar = await circleImage(pathAva);
      if (!fs.existsSync(path.join(cacheDir, "UTMAvoBold.ttf"))) {
        const font = (await axios.get('https://drive.google.com/u/0/uc?id=1DuI-ou9OGEkII7n8odx-A7NIcYz0Xk9o&export=download', { responseType: "arraybuffer" })).data;
        fs.writeFileSync(path.join(cacheDir, "UTMAvoBold.ttf"), Buffer.from(font));
      }
      const baseImage = await loadImage(pathImg);
      const baseAva = await loadImage(avatar);
      const baseLine = await loadImage(pathLine);
      const canvas = createCanvas(baseImage.width, baseImage.height);
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);
      registerFont(path.join(cacheDir, "UTMAvoBold.ttf"), { family: "UTMAvoBold" });
      ctx.strokeStyle = "rgba(255,255,255, 0.2)";
      ctx.lineWidth = 3;
      ctx.font = "100px UTMAvoBold";
      ctx.strokeText(name.toUpperCase(), 30, 100);
      ctx.strokeText(subname.toUpperCase(), 130, 200);
      ctx.textAlign = "right";
      ctx.strokeText(name.toUpperCase(), canvas.width - 30, canvas.height - 30);
      ctx.strokeText(name.toUpperCase(), canvas.width - 130, canvas.height - 130);
      ctx.fillStyle = "#ffffff";
      ctx.font = "55px UTMAvoBold";
      ctx.fillText(name.toUpperCase(), 680, 270);
      ctx.font = "40px UTMAvoBold";
      ctx.textAlign = "right";
      ctx.fillText(subname.toUpperCase(), 680, 320);
      ctx.font = "23px UTMAvoBold";
      ctx.textAlign = "start";
      ctx.fillText(phoneNumber.toUpperCase(), 1350, 252);
      ctx.fillText(email.toUpperCase(), 1350, 332);
      ctx.fillText(address.toUpperCase(), 1350, 410);
      ctx.globalCompositeOperation = "destination-out";
      ctx.drawImage(baseLine, 0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = "destination-over";
      ctx.fillStyle = color === 'no' ? '#ffffff' : color;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = "source-over";
      ctx.drawImage(baseAva, 824, 180, 285, 285);
      const imageBuffer = canvas.toBuffer();
      fs.writeFileSync(pathImg, imageBuffer);
      return pathImg;
};

module.exports = {
    v1
};