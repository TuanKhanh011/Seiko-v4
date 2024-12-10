const axios = require('axios');
const FormData = require('form-data');

async function v2(imageURL) {
    async function upscaleImage(imageData) {
        try {
            const url = 'https://api.imggen.ai/guest-upscale-image';
            const payload = {
                image: {
                    ...imageData,
                    url: 'https://api.imggen.ai' + imageData.url
                }
            };
            const response = await axios.post(url, payload);
            return {
                original_image: 'https://api.imggen.ai' + response.data.original_image,
                upscaled_image: 'https://api.imggen.ai' + response.data.upscaled_image
            };
        } catch (error) {
            console.error('Error during upscaling:', error.response ? error.response.data : error.message);
            throw error;
        }
    }
    try {
        const imageBuffer = await axios.get(imageURL, { responseType: 'arraybuffer' });
        const formData = new FormData();
        formData.append('image', imageBuffer.data, { filename: 'image.png' });
        const uploadResponse = await axios.post('https://api.imggen.ai/guest-upload', formData, {
            headers: formData.getHeaders()
        });
        const upscaledResponse = await upscaleImage(uploadResponse.data.image);
        return upscaledResponse;
    } catch (error) {
        console.error('Error uploading or processing image:', error.response ? error.response.data : error.message);
        throw error;
    }
};

module.exports = {
    v2
};