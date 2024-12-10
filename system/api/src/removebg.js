const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const { v4: uuidv4 } = require('uuid');

async function v1(imageUrl) {
    const tempFilePath = path.join(process.cwd(), 'srcipts', 'cmds', 'cache', `${uuidv4()}.jpg`);
    const headers = {
        'Accept': '*/*',
        'Accept-Encoding': 'gzip, deflate, br, zstd',
        'Accept-Language': 'vi,en;q=0.9',
        'Content-Type': 'multipart/form-data',
        'Cookie': `_ga=GA1.1.${Math.random().toString().substr(2)}; __eoi=ID=${uuidv4()}:T=1717863522:RT=${Math.floor(Date.now() / 1000)}:S=AA-AfjYNKyeeSeFWOceLt_cXZHyy; _ga_WBHK34L0J9=GS1.1.${Math.random().toString().substr(2)}`,
        'Origin': 'https://taoanhdep.com',
        'Sec-Ch-Ua': `"Not.A/Brand";v="24", "Google Chrome";v="125", "Chromium";v="125"`,
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
        'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        'X-Requested-With': 'XMLHttpRequest',
    };

    const downloadImage = async (url, filePath) => {
        const writer = fs.createWriteStream(filePath);
        const response = await axios({
            url,
            method: 'GET',
            responseType: 'stream'
        });
        response.data.pipe(writer);
        return new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });
    };

    const postToTaoanhdep = async (filePath) => {
        const form = new FormData();
        form.append('input_image', fs.createReadStream(filePath));
        const response = await axios.post('https://taoanhdep.com/public/xoa-nen.php', form, {
            headers: {
                ...headers,
                ...form.getHeaders()
            }
        });
        return response.data.split(',')[1];
    };

    const uploadToImgbb = async (base64Image) => {
        const form = new FormData();
        form.append('image', base64Image);
        const response = await axios.post(`https://api.imgbb.com/1/upload?key=ce5a95195ebc1c1d27af4d32d749cf7e`, form, {
            headers: form.getHeaders()
        });
        return response.data.data.url;
    };

    try {
        await downloadImage(imageUrl, tempFilePath);
        await new Promise(resolve => setTimeout(resolve, 1000));  // Adding a delay to ensure the file is fully written
        const base64Image = await postToTaoanhdep(tempFilePath);
        const imgbbUrl = await uploadToImgbb(base64Image);
        return imgbbUrl;
    } catch (error) {
        console.error('Error in processImage function:', error);
    } finally {
        fs.unlink(tempFilePath, (err) => {
            if (err) console.error('Error deleting temporary file:', err);
        });
    }
}

module.exports = {
    v1
};