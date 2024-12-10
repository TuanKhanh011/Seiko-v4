const axios = require('axios');

async function traffic123(url) {
  try {
    const { data } = await axios.get('https://traffic123.net/que?q=status,azauth,q,t,z&filter=connection');
    const { azauth, q, t } = data;
    const res = await axios.get(`https://traffic123.net/publisher?azauth=${azauth}&q=${q}&t=${t}&opa=123&z=${encodeURIComponent(url)}`);
    return res.data.password;
  } catch (error) {
    throw new Error(`Error bypassing traffic123 URL: ${error.message}`);
  }
}

async function link68(url) {
  try {
    const { data } = await axios.get('https://link68.net/que?q=status,azauth,q,t,z&filter=connection');
    const { azauth, q, t } = data;
    const res = await axios.get(`https://link68.net/publisher?azauth=${azauth}&q=${q}&t=${t}&opa=123&z=${encodeURIComponent(url)}`);
    return res.data.password;
  } catch (error) {
    throw new Error(`Error bypassing link68 URL: ${error.message}`);
  }
}

async function laymangay(url) {
  try {
    const { data } = await axios.get('https://laymangay.com/que?q=status,azauth,q,t,z&filter=connection');
    const { azauth, q, t } = data;
    const res = await axios.get(`https://laymangay.com/publisher?azauth=${azauth}&q=${q}&t=${t}&opa=123&z=${encodeURIComponent(url)}`);
    return res.data.password;
  } catch (error) {
    throw new Error(`Error bypassing laymangay URL: ${error.message}`);
  }
}

async function linkvertise(url) {
  try {
    const { data } = await axios.get(`https://api.bypass.vip/bypass?url=${encodeURIComponent(url)}`);
    return data;
  } catch (error) {
    throw new Error(`Error bypassing linkvertise URL: ${error.message}`);
  }
}

async function trafficuser(url) {
  try {
    const { data } = await axios.get('https://my.trafficuser.net/que?q=status,azauth,q,t,z&filter=connection');
    const { azauth, q, t } = data;
    const res = await axios.get(`https://my.trafficuser.net/publisher?azauth=${azauth}&q=${q}&t=${t}&opa=123&z=${encodeURIComponent(url)}`);
    return res.data.password;
  } catch (error) {
    throw new Error(`Error bypassing trafficuser URL: ${error.message}`);
  }
}

module.exports = {
  traffic123,
  link68,
  laymangay,
  linkvertise,
  trafficuser
};