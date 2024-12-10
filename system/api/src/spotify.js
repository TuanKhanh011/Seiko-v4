const axios = require('axios');
const fetch = require('node-fetch');

async function downloadv1(url) {
  if (!url) {
    throw new Error('URL is required');
  }
  try {
    const getOriginalUrl = async (url) => {
      try {
        const response = await fetch(url);
        return response.url;
      } catch (error) {
        throw new Error('Please input a valid URL');
      }
    };
    const originalUrl = await getOriginalUrl(url);
    const trackId = originalUrl.split('track/')[1].split('?')[0];
    const headers = {
      Origin: 'https://spotifydown.com',
      Referer: 'https://spotifydown.com/',
    };
    let apiUrl = '';
    if (url.includes('spotify.link')) {
      apiUrl = `https://api.spotifydown.com/metadata/track/${trackId}`;
    } else if (url.includes('open.spotify.com')) {
      apiUrl = `https://api.spotifydown.com/download/${trackId}`;
    } else {
      throw new Error('Invalid Spotify URL');
    }
    const response = await axios.get(apiUrl, { headers });
    return response.data;
  } catch (error) {
    throw new Error(`Error: ${error.message}`);
  }
};

module.exports = { 
   downloadv1
};