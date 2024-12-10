const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

module.exports = async function(link) {
  try {
    const { headers } = await axios.head(link);
    const contentType = headers['content-type'];
    const extension = contentType.split('/')[1] || 'bin';
    const filePath = path.join(process.cwd(), 'srcipts', 'cmds', 'cache', `${Date.now()}.${extension}`);
    
    const response = await axios({
      method: 'GET',
      url: link,
      responseType: 'stream'
    });

    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    const formData = new FormData();
    formData.append('reqtype', 'fileupload');
    formData.append('fileToUpload', fs.createReadStream(filePath));

    const { data } = await axios.post('https://catbox.moe/user/api.php', formData, {
      headers: formData.getHeaders(),
    });

    fs.unlinkSync(filePath);
    return data;
  } catch (error) {
    throw new Error(`Error uploading to catbox: ${error.message}`);
  }
};