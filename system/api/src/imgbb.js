const axios = require('axios');
const FormData = require('form-data');

module.exports = async (url) => {
  const apiKey = 'ce5a95195ebc1c1d27af4d32d749cf7e';
  try {
    const response = await axios.get(url, { responseType: 'stream' });
    const formData = new FormData();
    formData.append('image', response.data);
    const res = await axios.post(`https://api.imgbb.com/1/upload?key=${apiKey}`, formData, {
      headers: formData.getHeaders(),
    });
    return res.data.data.url;
  } catch (error) {
    throw new Error(`Error uploading image: ${error.message}`);
  }
};