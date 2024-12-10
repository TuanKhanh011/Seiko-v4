const request = require('request');
const axios = require('axios');
const cheerio = require('cheerio');
const FormData = require('form-data');
const fs = require("fs");
const stringSimilarity = require('string-similarity');
const path = require('path');
const fetch = require('node-fetch');
const { HttpsProxyAgent } = require('https-proxy-agent');
const https = require('https');
const qs = require('qs');
const got = require('got');
const { v4: uuidv4 } = require('uuid');
const JSONB = require('json-bigint');

const folderPathL = path.join(process.cwd(), 'system', 'data', 'media');
const filesL = fs.readdirSync(folderPathL);
filesL.forEach(file => {
    if (path.extname(file) === '.json') {
        const fileNameWithoutExt = path.basename(file, '.json');
        const filePath = path.join(folderPathL, file);
        const data = fs.readFileSync(filePath, 'utf8');
        const jsonData = JSON.parse(data);
        module.exports[fileNameWithoutExt] = jsonData;
    }
});

module.exports.violation = async (licensePlate, type) => {
  const data = qs.stringify({
    'BienSo': licensePlate,
    'LoaiXe': type
  });
    const randomUserAgent = () => {
    const versions = ["4.0.3", "4.1.1", "4.2.2", "4.3", "4.4", "5.0.2", "5.1", "6.0", "7.0", "8.0", "9.0", "10.0", "11.0"];
    const devices = ["M2004J19C", "S2020X3", "Xiaomi4S", "RedmiNote9", "SamsungS21", "GooglePixel5"];
    const builds = ["RP1A.200720.011", "RP1A.210505.003", "RP1A.210812.016", "QKQ1.200114.002", "RQ2A.210505.003"];
    const chromeVersion = `Chrome/${Math.floor(Math.random() * 80) + 1}.${Math.floor(Math.random() * 999) + 1}.${Math.floor(Math.random() * 9999) + 1}`;
    return `Mozilla/5.0 (Linux; Android ${versions[Math.floor(Math.random() * versions.length)]}; ${devices[Math.floor(Math.random() * devices.length)]} Build/${builds[Math.floor(Math.random() * builds.length)]}) AppleWebKit/537.36 (KHTML, like Gecko) ${chromeVersion} Mobile Safari/537.36 WhatsApp/1.${Math.floor(Math.random() * 9) + 1}.${Math.floor(Math.random() * 9) + 1}`;
  };
  const randomIP = () => `${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`;
  const headers = () => ({
    "User-Agent": randomUserAgent(),
    "X-Forwarded-For": randomIP(),
  });
  try {
    const config = {
  headers: {
    'Accept': '*/*',
    'Accept-Encoding': 'gzip, deflate, br, zstd',
    'Accept-Language': 'vi,en-US;q=0.9,en;q=0.8,fr-FR;q=0.7,fr;q=0.6',
    'Connection': 'keep-alive',
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    'Cookie': 'PHPSESSID=dv43ppcnp6d4hjmdu5inivem01; _ga=GA1.1.637084757.1719720763; __zi=2000.SSZzejyD2DOgdkEjonOFoJhVwRh36a249v7dee56KeuvWwMmbrKIqN-1fVtOLXZHUO2a_P5M5j0pXAVudrCQrpGp.1; BienSo=29A02782; _ga_CKW0H29HVP=GS1.1.1719720763.1.1.1719720841.0.0.0; _ga_LLLRL6SP1M=GS1.1.1719720763.1.1.1719720881.0.0.0',
    'Host': 'phatnguoixe.com',
    'Origin': 'https://phatnguoixe.com',
    'Referer': 'https://phatnguoixe.com/',
    'Sec-Ch-Ua': '"Google Chrome";v="123", "Not:A-Brand";v="8", "Chromium";v="123"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"Windows"',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-origin',
    'X-Requested-With': 'XMLHttpRequest',
    ...headers()
  }
};
    const response = await axios.post('https://phatnguoixe.com/1026', data, config);
    const $ = cheerio.load(response.data);
    const licensePlateResult = $('td.row_right').eq(0).text().trim();
    const vehicleColor = $('td.row_right').eq(1).text().trim();
    const vehicleType = $('td.row_right').eq(2).text().trim();
    const violationTime = $('td.row_right').eq(3).text().trim();
    const violationLocation = $('td.row_right').eq(4).text().trim();
    const violationDescription = $('td.row_right').eq(5).text().trim();
    const status = $('td.row_right').eq(6).find('button').text().trim();
    const issuingAuthority = $('td.row_right').eq(7).text().trim();
    const resolvingPlaces = [];
    let currentPlace = '';
    let contactPhone = '';
    $('td.row_right').slice(8).each((i, td) => {
      const text = $(td).text().trim();
      if (text.startsWith('Số điện thoại liên hệ:')) {
        contactPhone = text;
      } else if (text.match(/^\d+\.\s/)) {
        if (currentPlace) {
          resolvingPlaces.push(currentPlace.trim());
        }
        currentPlace = text;
      } else {
        currentPlace += ', ' + text;
      }
    });
    if (currentPlace) {
      resolvingPlaces.push(currentPlace.trim());
    }
    const resolvingPlacesStr = resolvingPlaces.map((place, index) => 
      `${place}`).join('\n');
    const detectedViolations = $('center').find('button.css-tt');
    let detectedInfo = '';
    detectedViolations.each((index, button) => {
      const status = $(button).text().trim();
      if (!status.includes('Chưa xử phạt')) {
        detectedInfo += `${index + 1}. ${status}\n`;
      }
    });
    return {
      licensePlate: licensePlateResult,
      vehicleColor,
      vehicleType,
      violationTime,
      violationLocation,
      violationDescription,
      status,
      issuingAuthority,
      resolvingPlaces: resolvingPlacesStr,
      contactPhone,
      detectedInfo
    };
  } catch (error) {
    throw new Error(`Failed to fetch data: ${error.message}`);
  }
}

module.exports.upscale = async function(imageUrl) {
const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Firefox/112.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edge/90.0.818.66 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:88.0) Gecko/20100101 Firefox/88.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:87.0) Gecko/20100101 Firefox/87.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:86.0) Gecko/20100101 Firefox/86.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:85.0) Gecko/20100101 Firefox/85.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.89 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.116 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:81.0) Gecko/20100101 Firefox/81.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:80.0) Gecko/20100101 Firefox/80.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:79.0) Gecko/20100101 Firefox/79.0',
];
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
        'User-Agent': userAgents[Math.floor(Math.random() * userAgents.length)],
        'X-Requested-With': 'XMLHttpRequest',
    };
    const downloadImage = async (url, filePath) => {
        const writer = fs.createWriteStream(filePath);
        const response = await axios({ url, method: 'GET', responseType: 'stream' });
        response.data.pipe(writer);
        return new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });
    };
    const postToTaoanhdep = async (filePath) => {
        const form = new FormData();
        form.append('file', fs.createReadStream(filePath));
        const response = await axios.post('https://taoanhdep.com/public/net-anh-nguoi.php', form, { headers });
        return response.data.split(',')[1];
    };
    const uploadToImgbb = async (base64Image) => {
        const form = new FormData();
        form.append('image', base64Image);
        const response = await axios.post(`https://api.imgbb.com/1/upload?key=ce5a95195ebc1c1d27af4d32d749cf7e`, form, { headers: form.getHeaders() });
        return response.data.data.url;
    };
    try {
        await downloadImage(imageUrl, tempFilePath);
        await new Promise(resolve => setTimeout(resolve, Math.random() * 3000 + 2000));
        const base64Image = await postToTaoanhdep(tempFilePath);
        const imgbbUrl = await uploadToImgbb(base64Image);
        return imgbbUrl;
    } catch (error) {
        console.error('Error in processImage function:', error);
    }
    fs.unlink(tempFilePath);
}

module.exports.upscalev2 = async function(imageURL) {
  async function upscaleImage(imageData) {
        try {
            var url = 'https://api.imggen.ai/guest-upscale-image';
            var payload = {
                image: {...imageData, url: 'https://api.imggen.ai' + imageData.url},
            };
            var response = await axios.post(url, payload);
            console.log('Response:', response.data);
            return {
                original_image: 'https://api.imggen.ai' + response.data.original_image,
                upscaled_image: 'https://api.imggen.ai' + response.data.upscaled_image,
            };
        } catch (error) {
            console.error('Error:', error.response ? error.response.data : error.message);
        }
}
    try {
            var imageBuffer = await axios.get(imageURL, { responseType: 'arraybuffer' });
            var formData = new FormData();
            formData.append('image', imageBuffer.data, { filename: 'image.png' });
            var response = await axios.post('https://api.imggen.ai/guest-upload', formData, {
                headers: {
                    ...formData.getHeaders()
                }
            });
            var resp = await upscaleImage(response.data.image);
            return resp;
        } catch (error) {
            console.error('Error uploading image:', error.response ? error.response.data : error.message);
        }
}

module.exports.gpt4 = async function(prompt) {
function getRandomProxy(proxyList) {
  var randomIndex = Math.floor(Math.random() * proxyList.length);
  return proxyList[randomIndex];
}

function fetchProxyList() {
  return fetch('https://proxylist.geonode.com/api/proxy-list?limit=100&page=1&sort_by=lastChecked&sort_type=desc')
    .then(function (response) {
      if (!response.ok) {
        throw new Error('Failed to fetch proxy list (' + response.status + ' ' + response.statusText + ')');
      }
      return response.json();
    })
    .then(function (data) {
      return data.data;
    })
    .catch(function (error) {
      console.error("Error fetching proxy list:", error.message);
      return [];
    });
}

function postWithProxy(url, data, headers) {
  return fetchProxyList().then(function (proxyList) {
    if (proxyList.length === 0) {
      console.log("Empty proxy list. Exiting.");
      return;
    }
    var randomProxy = getRandomProxy(proxyList);
    var protocol = randomProxy.protocols ? randomProxy.protocols[0] : 'socks4';
    var proxyUrl = (protocol || 'socks4') + '://' + randomProxy.ip + ':' + randomProxy.port;
    return fetch(url, {
      method: 'POST',
      headers: Object.assign({
        'Content-Type': 'application/json',
        'Proxy-Connection': 'keep-alive',
      }, headers),
      body: JSON.stringify(data),
      agent: new httpProxyAgent(proxyUrl),
    }).then(function (response) {
      if (!response.ok) {
        throw new Error('Request failed (' + response.status + ' ' + response.statusText + ')');
      }
      return response.json();
    }).then(function (responseData) {
      return responseData;
    }).catch(function (error) {
      console.error("Error:", error.message);
      return null;
    });
  });
}

function generateRandomId(length) {
  if (length === void 0) { length = 6; }
  var id = Math.random().toString(36).substring(2, length + 2);
  return id;
}
  var id = generateRandomId();
  var url = "https://chatgpt4online.org/wp-json/mwai-ui/v1/chats/submit";
  return fetch("https://chatgpt4online.org/#chat")
    .then(function (response) {
      return response.text();
    })
    .then(function (string) {
      var regex = /restNonce&quot;:&quot;([^&]+)&quot;/;
      var match = string.match(regex);
      if (match) {
        var restNonce = match[1];
        var payload = {
          botId: "default",
          messages: [
            {
              id: generateRandomId(),
              role: "assistant",
              content: "Hi! How can I help you?",
              who: "AI: ",
              timestamp: 1713758062698,
            },
          ],
          chatId: id,
          newMessage: prompt || "Hi",
          newFileId: null,
          session: "N/A",
          stream: false,
        };
        var headers = { "X-Wp-Nonce": restNonce };
        return postWithProxy(url, payload, headers).then(function (postResponse) {
          return postResponse;
        });
      } else {
        throw new Error("Failed to fetch X-Wp-Nonce");
      }
    })
    .catch(function (error) {
      console.error("Failed to submit chat message:", error.message);
      if (error.response) {
        console.error("Error response data:", error.response.data);
      }
      throw error;
    });
}

module.exports.pin = async (search) => {
    if (!search) {
        return { error: 'Thiếu dữ liệu để thực thi lệnh' };
    }
    const headers = {
        'authority': 'www.pinterest.com',
        'cache-control': 'max-age=0',
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
        'upgrade-insecure-requests': '1',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
        'sec-gpc': '1',
        'sec-fetch-site': 'same-origin',
        'sec-fetch-mode': 'same-origin',
        'sec-fetch-dest': 'empty',
        'accept-language': 'en-US,en;q=0.9',
        'cookie': 'csrftoken=92c7c57416496066c4cd5a47a2448e28; g_state={"i_l":0}; _auth=1; _pinterest_sess=TWc9PSZBMEhrWHJZbHhCVW1OSzE1MW0zSkVid1o4Uk1laXRzdmNwYll3eEFQV0lDSGNRaDBPTGNNUk5JQTBhczFOM0ZJZ1ZJbEpQYlIyUmFkNzlBV2kyaDRiWTI4THFVUWhpNUpRYjR4M2dxblJCRFhESlBIaGMwbjFQWFc2NHRtL3RUcTZna1c3K0VjVTgyejFDa1VqdXQ2ZEQ3NG91L1JTRHZwZHNIcDZraEp1L0lCbkJWUytvRis2ckdrVlNTVytzOFp3ZlpTdWtCOURnbGc3SHhQOWJPTzArY3BhMVEwOTZDVzg5VDQ3S1NxYXZGUEEwOTZBR21LNC9VZXRFTkErYmtIOW9OOEU3ektvY3ZhU0hZWVcxS0VXT3dTaFpVWXNuOHhiQWdZdS9vY24wMnRvdjBGYWo4SDY3MEYwSEtBV2JxYisxMVVsV01McmpKY0VOQ3NYSUt2ZDJaWld6T0RacUd6WktITkRpZzRCaWlCTjRtVXNMcGZaNG9QcC80Ty9ZZWFjZkVGNURNZWVoNTY4elMyd2wySWhtdWFvS2dQcktqMmVUYmlNODBxT29XRWx5dWZSc1FDY0ZONlZJdE9yUGY5L0p3M1JXYkRTUDAralduQ2xxR3VTZzBveUc2Ykx3VW5CQ0FQeVo5VE8wTEVmamhwWkxwMy9SaTNlRUpoQmNQaHREbjMxRlRrOWtwTVI5MXl6cmN1K2NOTFNyU1cyMjREN1ZFSHpHY0ZCR1RocWRjVFZVWG9VcVpwbXNGdlptVzRUSkNadVc1TnlBTVNGQmFmUmtrNHNkVEhXZytLQjNUTURlZXBUMG9GZ3YwQnVNcERDak16Nlp0Tk13dmNsWG82U2xIKyt5WFhSMm1QUktYYmhYSDNhWnB3RWxTUUttQklEeGpCdE4wQlNNOVRzRXE2NkVjUDFKcndvUzNMM2pMT2dGM05WalV2QStmMC9iT055djFsYVBKZjRFTkRtMGZZcWFYSEYvNFJrYTZSbVRGOXVISER1blA5L2psdURIbkFxcTZLT3RGeGswSnRHdGNpN29KdGFlWUxtdHNpSjNXQVorTjR2NGVTZWkwPSZzd3cwOXZNV3VpZlprR0VBempKdjZqS00ybWM9; _b="AV+pPg4VpvlGtL+qN4q0j+vNT7JhUErvp+4TyMybo+d7CIZ9QFohXDj6+jQlg9uD6Zc="; _routing_id="d5da9818-8ce2-4424-ad1e-d55dfe1b9aed"; sessionFunnelEventLogged=1'
    };
    const options = {
        url: `https://www.pinterest.com/search/pins/?q=${encodeURI(search)}&rs=typed&term_meta[]=${encodeURI(search)}%7Ctyped`,
        headers: headers,
    };
    return new Promise((resolve, reject) => {
        function callback(error, response, body) {
            if (!error && response.statusCode === 200) {
                const arrMatch = body.match(/https:\/\/i\.pinimg\.com\/originals\/[^.]+\.jpg/g);
                resolve({
                    count: arrMatch.length,
                    data: arrMatch,
                });
            } else {
                reject({ error: 'Không thể lấy dữ liệu từ Pinterest' });
            }
        }
        request(options, callback);
    });
};

module.exports.twdlv2 = async function(url) {
  const randomUserAgent = () => {
    const versions = ["4.0.3", "4.1.1", "4.2.2", "4.3", "4.4", "5.0.2", "5.1", "6.0", "7.0", "8.0", "9.0", "10.0", "11.0"];
    const devices = ["M2004J19C", "S2020X3", "Xiaomi4S", "RedmiNote9", "SamsungS21", "GooglePixel5"];
    const builds = ["RP1A.200720.011", "RP1A.210505.003", "RP1A.210812.016", "QKQ1.200114.002", "RQ2A.210505.003"];
    const chromeVersion = `Chrome/${Math.floor(Math.random() * 80) + 1}.${Math.floor(Math.random() * 999) + 1}.${Math.floor(Math.random() * 9999) + 1}`;
    return `Mozilla/5.0 (Linux; Android ${versions[Math.floor(Math.random() * versions.length)]}; ${devices[Math.floor(Math.random() * devices.length)]} Build/${builds[Math.floor(Math.random() * builds.length)]}) AppleWebKit/537.36 (KHTML, like Gecko) ${chromeVersion} Mobile Safari/537.36 WhatsApp/1.${Math.floor(Math.random() * 9) + 1}.${Math.floor(Math.random() * 9) + 1}`;
  };
  const randomIP = () => `${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`;
  const headers = () => ({
    "User-Agent": randomUserAgent(),
    "X-Forwarded-For": randomIP(),
  });
  function formatNumber(number) {
    if (isNaN(number)) {
        return null;
    }
    return number.toLocaleString('de-DE');
  }
  const getGuestToken = async () => {
    try {
      const { data } = await axios.post("https://api.twitter.com/1.1/guest/activate.json", {}, {
        headers: {
          Authorization: 'Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA',
          ...headers(),
        },
      });
      return data.guest_token;
    } catch {
      return null;
    }
  };
  const isValidUrl = (url) => /https?:\/\/(www\.)?(x\.com|twitter\.com)\/\w+\/status\/\d+/i.test(url);
  const rejectError = (msg) => Promise.reject(new Error(msg));
  if (!isValidUrl(url)) return rejectError("Invalid URL: " + url);
  const idMatch = url.match(/\/(\d+)/);
  if (!idMatch) return rejectError("Error getting Twitter ID. Ensure your URL is correct.");
  const tweetId = idMatch[1];
  const guestToken = await getGuestToken();
  if (!guestToken) return rejectError("Failed to get guest token. Authorization is invalid.");
  try {
    const { data } = await axios.get("https://api.twitter.com/graphql/7xflPyRiUxGVbJd4uWmbfg/TweetResultByRestId", {
      params: {
        variables: JSON.stringify({ tweetId, withCommunity: false, includePromotedContent: false, withVoice: false }),
        features: JSON.stringify({
          creator_subscriptions_tweet_preview_api_enabled: true,
          communities_web_enable_tweet_community_results_fetch: true,
          c9s_tweet_anatomy_moderator_badge_enabled: true,
          articles_preview_enabled: true,
          tweetypie_unmention_optimization_enabled: true,
          responsive_web_edit_tweet_api_enabled: true,
          graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
          view_counts_everywhere_api_enabled: true,
          longform_notetweets_consumption_enabled: true,
          responsive_web_twitter_article_tweet_consumption_enabled: true,
          tweet_awards_web_tipping_enabled: false,
          creator_subscriptions_quote_tweet_preview_enabled: false,
          freedom_of_speech_not_reach_fetch_enabled: true,
          standardized_nudges_misinfo: true,
          tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true,
          tweet_with_visibility_results_prefer_gql_media_interstitial_enabled: true,
          rweb_video_timestamps_enabled: true,
          longform_notetweets_rich_text_read_enabled: true,
          longform_notetweets_inline_media_enabled: true,
          rweb_tipjar_consumption_enabled: true,
          responsive_web_graphql_exclude_directive_enabled: true,
          verified_phone_label_enabled: false,
          responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
          responsive_web_graphql_timeline_navigation_enabled: true,
          responsive_web_enhance_cards_enabled: false,
        }),
        fieldToggles: JSON.stringify({
          withArticleRichContentState: true,
          withArticlePlainText: false,
        }),
      },
      headers: {
        Authorization: 'Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA',
        "x-guest-token": guestToken,
        ...headers(),
      },
    });
    const tweetResult = data.data.tweetResult?.result;
    if (!tweetResult) return rejectError("Tweet not found.");
    if (tweetResult.reason === "NsfwLoggedOut") return rejectError("This tweet contains sensitive content. Please use cookies to avoid errors.");
    const tweet = tweetResult.__typename === "TweetWithVisibilityResults" ? tweetResult.tweet : tweetResult;
    const user = tweet.core.user_results.result;
    const media = tweet.legacy?.entities?.media || [];
    const attachments = media.map(m => {
      if (m.type === "photo") {
        return {
          type: "Photo",
          url: m.media_url_https
        };
      } else if (m.type === "animated_gif" || m.type === "video") {
        const bestVariant = m.video_info.variants.reduce((prev, curr) => (prev.bitrate > curr.bitrate ? prev : curr), {});
        return {
          type: "Video",
          url: bestVariant.url
        };
      }
    });
    return {
      id: tweet.legacy.id_str,
      message: tweet.note_tweet?.note_tweet_results?.result?.text || null,
      author: `${user.legacy.name} (${user.legacy.screen_name})`,
      created_at: tweet.legacy.created_at,
      replies: formatNumber(tweet.legacy.reply_count) || 0,
      retweets: formatNumber(tweet.legacy.retweet_count) || 0,
      favorites: formatNumber(tweet.legacy.favorite_count) || 0,
      views: formatNumber(Number(tweet.views.count)) || 0,
      attachments: attachments.length ? attachments : [],
    };
  } catch (err) {
    return rejectError(err.message);
  }
};

module.exports.instadl = async function(link) {
const cookie = 'wd=600x1153; mid=ZoTOyAALAAEP2pC14FT_nPOKtMgV; ig_did=D5F18322-A0BF-45E1-A66D-ED08BFA5ED3E; datr=yM6EZtQko-OSwboElhfm0T3_; ig_nrcb=1; csrftoken=vis75yhD4PgqjPIIpZ0UjGCYyY9UIInc; ds_user_id=67570554512; sessionid=67570554512%3AFMZLH8xLvehtDc%3A4%3AAYcOUf7mrwlnKR2TNPBcz7po7S487PhuYuNqKJ0GSQ; ps_n=1; ps_l=1; rur="CCO\05467570554512\0541751553996:01f744a347539f48ce52b8d5d280fe5fb8afd42bda212c11fdcdfff88ed89f3e1f69eb43"; useragent=TW96aWxsYS81LjAgKFdpbmRvd3MgTlQgMTAuMDsgV2luNjQ7IHg2NCkgQXBwbGVXZWJLaXQvNTM3LjM2IChLSFRNTCwgbGlrZSBHZWNrbykgQ2hyb21lLzEyNS4wLjAuMCBTYWZhcmkvNTM3LjM2; _uafec=Mozilla%2F5.0%20(Windows%20NT%2010.0%3B%20Win64%3B%20x64)%20AppleWebKit%2F537.36%20(KHTML%2C%20like%20Gecko)%20Chrome%2F125.0.0.0%20Safari%2F537.36;';
 function formatNumber(number) {
    if (isNaN(number)) {
        return null;
     }
      return number.toLocaleString('de-DE');
  }
  async function getPost(url, cookie) {
  const headers = {
  "accept": "*/*",
  "accept-language": "vi,en-US;q=0.9,en;q=0.8",
  "sec-ch-ua": "\"Chromium\";v=\"106\", \"Microsoft Edge\";v=\"106\", \"Not;A=Brand\";v=\"99\"",
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": "\"Windows\"",
  "sec-fetch-dest": "empty",
  "sec-fetch-mode": "cors",
  "sec-fetch-site": "same-site",
  "x-asbd-id": "198387",
  "x-csrftoken": "tJk2tDhaeYfUeJRImgbH75Vp6CV6PjtW",
  "x-ig-app-id": "936619743392459",
  "x-ig-www-claim": "hmac.AR1NFmgjJtkM68KRAAwpbEV2G73bqDP45PvNfY8stbZcFiRA",
  "x-instagram-ajax": "1006400422",
  "Referer": "https://www.instagram.com/",
  "Referrer-Policy": "strict-origin-when-cross-origin"
};
  if (!url || !url.match(/https:\/\/www\.instagram\.com\/(p|tv|reel)\/[a-zA-Z0-9]+/)) {
    throw new Error("Invalid or missing URL");
  }
  headers.cookie = cookie;
  const { data } = await axios.get(url, { headers });
  const postId = data.match(/instagram:\/\/media\?id=(\d+)/)?.[1];
  if (!postId) throw new Error("Post not found");
  const { data: postInfo } = await axios.get(`https://www.instagram.com/api/v1/media/${postId}/info/`, { headers });
  delete headers.cookie;
  const info = postInfo.items?.[0] || {};
  const dataReturn = {
    images: [],
    videos: []
  };
  if (info.video_versions) {
    dataReturn.videos = [info.video_versions[info.video_versions.length - 1].url];
  } else {
    const allImage = info.carousel_media || [{ image_versions2: info.image_versions2 }];
    dataReturn.images = allImage.map(item => item.image_versions2.candidates[0].url);
  }
  const postData = {
    ...dataReturn,
    caption: info.caption?.text || "",
    owner: {
      id: info.user.pk,
      username: info.user.username,
      full_name: info.user.full_name,
      profile_pic_url: info.user.profile_pic_url
    },
    like_count: info.like_count,
    comment_count: info.comment_count,
    created_at: info.taken_at,
    media_type: info.media_type,
    originalData: info
  };
   const attachments = [];
   if (postData.images && postData.images.length > 0) {
          attachments.push(...postData.images.map(imageUrl => ({
                type: "Photo",
                url: imageUrl
            })));
       } else if (postData.videos && postData.videos.length > 0) {
          attachments.push(...postData.videos.map(videoUrl => ({
                type: "Video",
                url: videoUrl
             })));
         }
  return {
       id: postData.originalData.id,
       message: postData?.caption || null,
       author: postData ? `${postData.owner.full_name} (${postData.owner.username})` : null,
       like: formatNumber(postData?.like_count) || null,
       comment: formatNumber(postData?.comment_count) || null,
       play: formatNumber(postData.originalData.play_count) || null,
       attachments
    };
}
async function getStories(url, cookie) {
  const headers = {
  "accept": "*/*",
  "accept-language": "vi,en-US;q=0.9,en;q=0.8",
  "sec-ch-ua": "\"Chromium\";v=\"106\", \"Microsoft Edge\";v=\"106\", \"Not;A=Brand\";v=\"99\"",
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": "\"Windows\"",
  "sec-fetch-dest": "empty",
  "sec-fetch-mode": "cors",
  "sec-fetch-site": "same-site",
  "x-asbd-id": "198387",
  "x-csrftoken": "tJk2tDhaeYfUeJRImgbH75Vp6CV6PjtW",
  "x-ig-app-id": "936619743392459",
  "x-ig-www-claim": "hmac.AR1NFmgjJtkM68KRAAwpbEV2G73bqDP45PvNfY8stbZcFiRA",
  "x-instagram-ajax": "1006400422",
  "referer": "https://www.instagram.com/",
  "referrer-policy": "strict-origin-when-cross-origin",
  'x-ig-app-id': '936619743392459',
  'x-ig-www-claim': 'hmac.AR2zPqOnGfYtujT0tmDsmiq0fdQ3f9DN4xXJ-J3EXnE6vFfA',
  'x-instagram-ajax-c2': 'b9a1aaad95e9',
  'x-instagram-ajax-c2-t': '41e3f8b',
  'x-requested-with': 'XMLHttpRequest'
};
  headers.cookie = cookie;
  async function getUserId(username) {
  const userRes = await axios.get(`https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`, { headers });
     return userRes.data.data.user.id;
  }
  const username = url.match(/instagram\.com\/stories\/([^/]+)\//)?.[1] || null;
  const userId = await getUserId(username);
  const getId = url.match(/\/stories\/[^\/]+\/(\d+)/)?.[1] || null;
  const storiesRes = await axios.get(`https://www.instagram.com/graphql/query/?query_hash=de8017ee0a7c9c45ec4260733d81ea31&variables={"reel_ids":["${userId}"],"tag_names":[],"location_ids":[],"highlight_reel_ids":[],"precomposed_overlay":false,"show_story_viewer_list":true}`, { headers });
  delete headers.cookie;
  const data = storiesRes.data.data.reels_media[0].items;
  const res = data.find(item => item.id === getId);
  let attachments = [];
    if (res.video_resources && res.video_resources.length > 0) {
      attachments.push({
        type: "Video",
        url: res.video_resources[0].src
      });
    } else if (res.display_resources && res.display_resources.length > 0) {
      attachments.push({
        type: "Photo",
        url: res.display_resources[0].src
      });
    }
    return {
       id: res.id,
       message: null,
       author: null,
       like: null,
       comment: null,
       play: null,
       attachments
    };
}
async function getHighlight(url, cookie) {
  try {
    const headers = {
      "accept": "*/*",
      "accept-language": "vi,en-US;q=0.9,en;q=0.8",
      "sec-ch-ua": "\"Chromium\";v=\"106\", \"Microsoft Edge\";v=\"106\", \"Not;A=Brand\";v=\"99\"",
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": "\"Windows\"",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-site",
      "x-asbd-id": "198387",
      "x-csrftoken": "tJk2tDhaeYfUeJRImgbH75Vp6CV6PjtW",
      "x-ig-app-id": "936619743392459",
      "x-ig-www-claim": "hmac.AR1NFmgjJtkM68KRAAwpbEV2G73bqDP45PvNfY8stbZcFiRA",
      "x-instagram-ajax": "1006400422",
      "referer": "https://www.instagram.com/",
      "referrer-policy": "strict-origin-when-cross-origin",
      'x-ig-app-id': '936619743392459',
      'x-ig-www-claim': 'hmac.AR2zPqOnGfYtujT0tmDsmiq0fdQ3f9DN4xXJ-J3EXnE6vFfA',
      'x-instagram-ajax-c2': 'b9a1aaad95e9',
      'x-instagram-ajax-c2-t': '41e3f8b',
      'x-requested-with': 'XMLHttpRequest',
    };
    const storyId = url.match(/story_media_id=([^&]+)/)?.[1];
    headers.cookie = cookie;
    const res = await axios.get(`https://i.instagram.com/api/v1/media/${storyId}/info/`,  { headers });
    delete headers.cookie;
    const data = res.data.items;
    const resp = data.find(item => item.id === storyId);
    let attachments = [];
    if (resp.video_versions && resp.video_versions.length > 0) {
      attachments.push({
        type: "Video",
        url: resp.video_versions[0].url
      });
    } else if (resp.image_versions2 && resp.image_versions2.candidates && resp.image_versions2.candidates.length > 0) {
      attachments.push({
        type: "Photo",
        url: resp.image_versions2.candidates[0].url
      });
    }
    return {
      id: resp.id,
      message: resp.caption,
      author: `${resp.user.full_name} (${resp.user.username})`,
      like: null,
      comment: null,
      play: null,
      attachments
    }
  } catch (error) {
    console.error(error);
  }
}  
  if (/https:\/\/www\.instagram\.com\/(p|tv|reel)\/[a-zA-Z0-9]+/.test(link)) {
      const data = await getPost(link, cookie);
      return data;
    } else if (/https:\/\/www\.instagram\.com\/stories\/[\w.]+\/\d+(\?[^\s]*)?/.test(link)) {
      const data = await getStories(link, cookie);
      return data;
    } else {
      const data = await getHighlight(link, cookie);
      return data;
    }
}

module.exports.facebookdl = async function(url) {
function formatNumber(number) {
    if (isNaN(number)) {
        return null;
     }
     return number.toLocaleString('de-DE');
}
class AttachmentFormatter {
    static stories(data, storyID) {
        return {
            bucketID: data?.bucket?.id.toString(),
            message: '',
            author: data?.bucket?.story_bucket_owner?.name,
            queryStorieID: storyID ? storyID : null,
            attachments: data?.bucket?.unified_stories?.edges.map( item => ({   
                id: item?.node?.id,
                like: formatNumber(item?.node?.story_card_info?.feedback_summary?.total_reaction_count) || 0,
                type: item?.node?.attachments?.[0]?.media?.__typename,
                url: item?.node?.attachments?.[0]?.media?.__typename === 'Photo' ? item?.node?.attachments?.[0]?.media?.image?.uri :
                    {
                        sd: item?.node?.attachments?.[0]?.media?.browser_native_sd_url,
                        hd: item?.node?.attachments?.[0]?.media?.browser_native_hd_url,
                    }
            
            }))
        }
    };
    static previewMedia(data) { 
        return {
            id: data?.link_preview?.story_attachment?.style_infos?.[0]?.fb_shorts_story?.post_id,
            message: (data?.link_preview?.story_attachment?.title || '') + '',
            like: formatNumber(data?.link_preview?.story_attachment?.target?.feedback?.reactors?.count) || 0,
            comment: formatNumber(data?.link_preview?.story_attachment?.target?.top_level_comments?.total_count) || 0,
            share: formatNumber(data?.link_preview?.story_attachment?.target?.reshares?.count) || 0,
            author: data?.link_preview?.story_attachment?.style_infos?.[0]?.fb_shorts_story?.short_form_video_context?.video_owner?.name || data?.link_preview?.story_attachment?.style_infos?.[0]?.actors[0]?.name,
            attachments: [{
                id: data?.link_preview?.story_attachment?.style_infos?.[0]?.fb_shorts_story?.short_form_video_context?.video?.id.toString(),
                type: 'Video',
                url: {
                    sd: data?.link_preview.story_attachment?.style_infos?.[0]?.fb_shorts_story?.short_form_video_context?.video?.original_download_url_sd,
                    hd: data?.link_preview.story_attachment?.style_infos?.[0]?.fb_shorts_story?.short_form_video_context?.video?.original_download_url_hd,
                }
            }]
        }
    };
    static mobileMedia(data) {
        return {
            id: data?.reduced_node?.post_id.toString(),
            message: (data?.reduced_node?.message?.text || '') + '',
            like: formatNumber(data?.reduced_node?.feedback?.reactors?.count) || 0,
            comment: formatNumber(data?.reduced_node?.feedback?.top_level_comments?.total_count) || 0,
            author: (data?.reduced_node?.feedback?.owning_profile?.name),
            attachments: data?.mediaset?.media?.edges.map(item => ({
                id: item.node?.id.toString(),
                type: item.node?.__typename,
                url: item.node?.__typename == 'Photo' ? item?.node?.image?.uri :
                    {
                        sd: item?.node?.playable_url,
                        hd: item?.node?.hd_playable_url,
                    },
            }))
        };
    };
    static webMedia(data) {         
        const type = data?.attachments[0]?.styles?.attachment ||
            data.attached_story?.attachments[0]?.styles?.attachment ||
            data?.content?.story?.attached_story?.attachments[0]?.styles?.attachment ||
            data?.content?.story?.comet_sections ||
            data?.comet_sections?.attached_story?.story?.attached_story?.comet_sections?.attached_story_layout?.story?.attachments?.[0]?.styles?.attachment;
        if (type?.subattachments) {
            return {
                message: (data?.message?.text || '') + '',
                author: data?.actors[0]?.name,
                attachments: (data?.attachments[0]?.styles?.attachment?.subattachments || data?.comet_sections?.attached_story?.story?.attached_story?.comet_sections?.attached_story_layout?.story?.attachments?.[0]?.styles?.attachment?.subattachments).filter(item => item?.multi_share_media_card_renderer?.attachment?.media?.__typename !== 'GenericAttachmentMedia').map( item => ({
                    id: item?.multi_share_media_card_renderer?.attachment?.media?.id?.toString(),
                    type: item?.multi_share_media_card_renderer?.attachment?.media?.__typename,
                    url: item?.multi_share_media_card_renderer?.attachment?.media?.__typename === 'Photo' ? item?.multi_share_media_card_renderer?.attachment?.media?.image?.uri :
                        {
                            sd: item?.multi_share_media_card_renderer?.attachment?.media?.browser_native_sd_url,
                            hd: item?.multi_share_media_card_renderer?.attachment?.media?.browser_native_hd_url,
                        },

                }))
            };
        } else if (type?.media) {
            const mediaData = data?.attachments[0]?.styles?.attachment || data.attached_story?.attachments[0]?.styles?.attachment;
            return {
                message: (data?.message?.text || '') + '',
                author: data?.actors[0]?.name,
                attachments: [{
                    id: mediaData?.media?.id?.toString(),
                    type: mediaData?.media?.__typename,
                    url: mediaData?.media?.__typename == 'Photo' ? mediaData?.media?.photo_image?.uri || mediaData?.media?.image?.uri :
                        {
                            sd: mediaData?.media.browser_native_sd_url,
                            hd: mediaData?.media.browser_native_he_url,
                        }
                }]
            };
        } else if (type?.style_infos) {
            return {
                message: (data?.message?.text || (data?.attachments[0]?.styles?.attachment?.style_infos[0]?.fb_shorts_story?.message?.text || '')) + '',
                author: data?.actors[0]?.name,
                attachments: [{
                    id: data?.attachments[0]?.styles?.attachment?.style_infos?.[0]?.fb_shorts_story?.short_form_video_context?.playback_video?.id?.toString(),
                    type: 'Video',
                    url: {
                        sd: data?.attachments[0].styles.attachment.style_infos[0].fb_shorts_story.short_form_video_context.playback_video.browser_native_sd_url,
                        hd: data?.attachments[0].styles.attachment.style_infos[0].fb_shorts_story.short_form_video_context.playback_video.browser_native_hd_url,
                    }
                }]
            };
        } else return { error: 'Cannot fetch stories & media info.', at: 'FetchStoriesAndMedia', detail: 'Facebook did not respond with correct data.' };
    }
}
class Utils {
    static async postWithToken(url, form, userAgent) {
        return await got.post(url, {
            headers: {
                'authorization': 'OAuth EAAAAUaZA8jlABOw6dLKYdY0L6wR3m3GsSIxZCNowKVJ7SOLasFW4J48ch1MD0DUHTfqXZBEK3uIx8XpMkRggZAMhl413fd5nuuBaBsKs72OMaCOSiHQjYUHF7K6t9TgSC0sSUkBUA6T8drjh16zidBDvklAPPUu9FEORb0wi9K5w4KuFKPvrcRBSbQZDZD',
                'user-agent': '[FBAN/FB4A;FBAV/417.0.0.33.65;FBBV/480085463;FBDM/{density=2.75,width=1080,height=2029};FBLC/vi_VN;FBRV/0;FBCR/VinaPhone;FBMF/Xiaomi;FBBD/Xiaomi;FBPN/com.facebook.katana;FBDV/MI 8 SE;FBSV/9;FBOP/1;FBCA/armeabi-v7a:armeabi;]',
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            form,
            decompress: true,
        })
    };
    static async postWithCookie(url, form, userAgent) {
        return await got.post(url, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Cookie': global.account.cookie,
            },
            form,
            decompress: true,
        })
    };
    static getType(obj) {
        const cName = obj.constructor?.name
        const gName = Object.prototype.toString.call(obj).slice(8, -1)
        if (cName?.toLowerCase() === gName?.toLowerCase()) return cName
        else return !cName || cName?.toLowerCase() === 'object' ? gName : cName
    };
    static makeParsable(data) {
        const withoutForLoop = data.body.replace(/for\s*\(\s*;\s*;\s*\)\s*;\s*/, '')
        const maybeMultipleObjects = withoutForLoop.split(/\}\s*\{/)
        if (maybeMultipleObjects.length === 1) return maybeMultipleObjects[0]
        return `[${maybeMultipleObjects.join('},{')}]`
    };
    static parseFromBody(data) {
        if (typeof data.body !== 'string') return data.body
        try {
            const result = JSON.parse(this.makeParsable(data))
            const type = this.getType(result)
            return type === 'Object' || type === 'Array' ? result : data.body
        }
        catch (err) {
            return data.body
        }
    };
    static parseFromJSONB(data) {
        return JSONB.parse(data);
    }
};
class Facebook {
    #urlRegex = /\b(?:https?:\/\/(?:www\.)?(?:facebook\.com|mbasic\.facebook\.com|m\.facebook\.com|mobile\.facebook\.com|fb\.watch|web\.facebook)[^\s]*)\b/g;
    #IGUrlRegex = /(https:\/\/www\.instagram\.com\/(stories|p|reel|tv)\/[a-zA-Z0-9_\-\/?=\.]+)(?=\s|\/|$)/g
    #onlyVideoRegex = /^https:\/\/(?:www|m|mbasic|mobile|web)\.facebook\.com\/(?:watch\?v=\d+|reel\/|videos\/[^\/?#]+\/?\??[^\/?#]*)$/;
    #profileRegex = /^https:\/\/(?:(www|m|mbasic|mobile|web)\.)?facebook\.com\/(?!(?:watch|photo|groups|share|stories|reel|videos|pages|story.php|permalink.php|video.php))(?:(?!profile\.php\?id=\d+\?)[^\/?]+|profile\.php\?id=\d+\?(?!id=).*|\profile\.php\?id=\d+$)\/?\??[^\/?]*$/;
    #storiesRegex = /\/stories\/(\d+)(?:\/([^\/?]+))?/;
    async #StoriesBucketQuery(bucketID, storyID) {
        const resData = await Utils.postWithToken(
            'https://graph.facebook.com/graphql',
            {
                fb_api_caller_class: 'RelayModern',
                fb_api_req_friendly_name: 'StoriesSuspenseContentPaneRootWithEntryPointQuery',
                doc_id: '7114359461936746',
                variables: JSON.stringify({ bucketID: bucketID, blur: 10, cursor: null, scale: 1 })
            },
        ).then(data => Utils.parseFromBody(data)).catch(error => error?.response?.body || error.message);
        return AttachmentFormatter.stories((resData?.data || resData?.[0].data), storyID);
    };
    async FetchStoriesAndMedia(url) {
        try {
            if (this.#storiesRegex.test(url))
                return this.#StoriesBucketQuery(this.#storiesRegex.exec(url)[1], this.#storiesRegex.exec(url)[2]);
            if (!this.#urlRegex.test(url))
                return { error: 'Cannot fetch facebook stories & media info.', at: 'FetchStoriesAndMedia', detail: 'The URL you entered is not valid.' };               
            if (this.#profileRegex.test(url))
                return { error: 'Cannot fetch facebook stories & media info.', at: 'FetchStoriesAndMedia', detail: 'The URL you entered is not valid.' };
            let resData = await Utils.postWithToken(
                'https://graph.facebook.com/graphql',
                {
                    fb_api_req_friendly_name: 'ComposerLinkPreviewQuery',
                    client_doc_id: '89598650511870084207501691272',
                    variables: JSON.stringify({
                        params: {
                            url: url
                        }
                    })
                },
            ).then(data => Utils.parseFromBody(data)).catch(error => error?.response?.body || error.message);
            if (!resData || resData.error || resData.errors) return { error: 'Cannot fetch facebook stories & media info.', at: 'FetchStoriesAndMedia', detail: 'Facebook did not respond with correct data.' };
            if (this.#onlyVideoRegex.test(url) || this.#onlyVideoRegex.test(decodeURIComponent(resData?.data?.link_preview?.story_attachment?.style_infos?.[0]?.fb_shorts_story?.storyUrl)) || this.#IGUrlRegex.test(decodeURIComponent(resData?.data?.link_preview?.story_attachment?.style_infos?.[0]?.fb_shorts_story?.storyUrl)))
                return AttachmentFormatter.previewMedia(resData.data);    
           const share_params = Utils.parseFromJSONB(resData?.data?.link_preview?.share_scrape_data).share_params;
           if (share_params && this.#storiesRegex.test(share_params?.urlInfo?.canonical))
                return this.#StoriesBucketQuery(this.#storiesRegex.exec(share_params?.urlInfo?.canonical)[1], this.#storiesRegex.exec(share_params?.urlInfo?.canonical)[2]);
           if (!resData?.data?.link_preview?.story?.id) return { error: 'Cannot fetch facebook stories & media info.', at: 'FetchStoriesAndMedia', detail: 'Facebook did not respond with correct data.' };
            const post_id = share_params[0]?.toString();
            const node_id = resData?.data?.link_preview?.story?.id;
            resData = await Utils.postWithToken(
                'https://graph.facebook.com/graphql',
                {
                    fb_api_req_friendly_name: 'FetchGraphQLStoryAndMediaFromTokenQuery',
                    client_doc_id: '14968485422525517963281561600',
                    variables: JSON.stringify({ action_location: "feed", include_image_ranges: true, image_medium_height: 2048, query_media_type: "ALL", automatic_photo_captioning_enabled: false, image_large_aspect_height: 565, angora_attachment_profile_image_size: 110, profile_pic_media_type: "image/x-auto", poll_facepile_size: 110, scale: 3, enable_cix_screen_rollout: true, default_image_scale: 3, angora_attachment_cover_image_size: 1320, poll_voters_count: 5, image_low_height: 2048, image_large_aspect_width: 1080, image_low_width: 360, image_high_height: 2048, question_poll_count: 100, node_id: node_id, icon_scale: 3, nt_context: { styles_id: "e6c6f61b7a86cdf3fa2eaaffa982fbd1", using_white_navbar: true, pixel_ratio: 3, is_push_on: true, bloks_version: "c3cc18230235472b54176a5922f9b91d291342c3a276e2644dbdb9760b96deec" }, can_fetch_suggestion: false, profile_image_size: 110, reading_attachment_profile_image_height: 371, reading_attachment_profile_image_width: 248, fetch_fbc_header: true, size_style: "contain-fit", photos_feed_reduced_data_fetch: true, media_paginated_object_first: 200, in_channel_eligibility_experiment: false, fetch_cix_screen_nt_payload: true, media_token: `pcb.${post_id}`, fetch_heisman_cta: true, fix_mediaset_cache_id: true, location_suggestion_profile_image_size: 110, image_high_width: 1080, media_type: "image/jpeg", image_medium_width: 540 }),
                    fb_api_caller_class: 'graphservice',
                    fb_api_analytics_tags: JSON.stringify(["At_Connection", "GraphServices"])
                },
            ).then(data => Utils.parseFromBody(data)).catch(error => error?.response?.body || error.message);
            if (!resData || resData.error || resData.errors) return { error: 'Cannot fetch facebook stories & media info.', at: 'FetchStoriesAndMedia', detail: 'Facebook did not respond with correct data.' };
            if (!resData?.data?.mediaset?.media?.edges || resData?.data?.mediaset?.media?.edges.length == 0) {
                resData = await Utils.postWithToken(
                    'https://graph.facebook.com/graphql',
                    {
                        fb_api_req_friendly_name: 'CometSinglePostContentQuery',
                        doc_id: 8362454010438212,
                        variables: JSON.stringify({ feedbackSource: 2, feedLocation: "PERMALINK", privacySelectorRenderLocation: "COMET_STREAM", renderLocation: "permalink", scale: 1.5, storyID: node_id, useDefaultActor: false, })
                    },
                ).then(data => Utils.parseFromBody(data)).catch(error => error?.response?.body || error.message);
                if (!resData || resData.error || resData.errors) return { error: 'Cannot fetch facebook stories & media info.', at: 'FetchStoriesAndMedia', detail: 'Facebook did not respond with correct data.' };
                const { content } = resData?.data?.node?.comet_sections || resData[0]?.data?.node?.comet_sections;                           
                return { id: post_id, ...AttachmentFormatter.webMedia(content.story) };
            }
            return AttachmentFormatter.mobileMedia(resData?.data);
        } catch (error) {
            console.error(error);
            return { error: 'Cannot fetch facebook stories & media info.', at: 'FetchStoriesAndMedia', detail: error?.response || error.message }
          }
       };
    };
    const facebook = new Facebook();
    try {
        const result = await facebook.FetchStoriesAndMedia(decodeURIComponent(url));
        return result;
    } catch (error) {
        console.log(error);
    }
}

module.exports.scldl = async (url) => {
    try {
        const response = await axios.post("https://www.klickaud.co/download.php", new URLSearchParams(Object.entries({
            'value': url,
            'afae4540b697beca72538dccafd46ea2ce84bec29b359a83751f62fc662d908a': '2106439ef3318091a603bfb1623e0774a6db38ca6579dae63bcbb57253d2199e'
        })), {
            headers: {
                "content-type": "application/x-www-form-urlencoded",
                "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36"
            }
        });
        const $ = cheerio.load(response.data);
        const title = $('#header > div > div > div.col-lg-8 > div > table > tbody > tr > td:nth-child(2)').text();
        const link = $('#dlMP3').attr('onclick').split(`downloadFile('`)[1].split(`',`)[0];
        const result = {
                title: title,
                link: link
        };
        return result;
    } catch (error) {
        throw error;
    }
};

module.exports.capcutdl = async (url) => {
  try {
    const extractLinks = (text) => {
      const regex = /(https:\/\/www.capcut.com\/t\/[a-zA-Z0-9_-]+)|(https:\/\/www.capcut.com\/template-detail\/[a-zA-Z0-9_-]+)/g;
      const matches = text.match(regex);
      return matches ? matches[0] : null;
    };
    const link = extractLinks(url);
    if (!link) {
      throw new Error('Link này không phải là link mẫu capcut, vui lòng thay bằng link mẫu capcut');
    }
    const a = await axios.get(`https://ssscap.net/api/download/get-url?url=${link}`);
    const videoId = a.data.url.split("/")[4].split("?")[0];
    const options = {
      method: 'GET',
      url: `https://ssscap.net/api/download/${videoId}`,
      headers: {
        'Connection': 'keep-alive',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36',
        'Cookie': 'sign=08321c1cc11dbdd2d6e3c63f44248dcf; device-time=1699454542608',
        'Referer': 'https://ssscap.net/vi',
        'Host': 'ssscap.net',
        'Accept-Language': 'vi-VN,vi;q=0.9',
        'Accept': 'application/json, text/plain, */*',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Site': 'same-origin',
        'Sec-Fetch-Mode': 'cors'
      }
    };
    const response = await axios.request(options);
    const { title, description, usage, originalVideoUrl } = response.data;
    return {
      title: title,
      description: description,
      usage: usage,
      urlVideo: link,
      video: `https://ssscap.net${originalVideoUrl}`
    };
  } catch (error) {
    throw new Error('Không tìm thấy mẫu');
  }
};

module.exports.catbox = async function(link) {
try {
  const { headers } = await axios.head(link);
  const contentType = headers['content-type'];
  const extension = contentType.split('/')[1] || 'bin';
  const filePath = path.join(process.cwd(), 'srcipts', 'cmds', 'cache', `${Date.now()}.${extension}`);
  const response = await axios({ method: 'GET', url: link, responseType: 'stream' });
  const writer = fs.createWriteStream(filePath);
  response.data.pipe(writer);
  await new Promise((resolve, reject) => writer.on('finish', resolve).on('error', reject));
  const formData = new FormData();
  formData.append('reqtype', 'fileupload');
  formData.append('fileToUpload', fs.createReadStream(filePath));
  const { data } = await axios.post('https://catbox.moe/user/api.php', formData, {
    headers: formData.getHeaders(),
  });
  fs.unlinkSync(filePath);
  return data;
  } catch (error) {
    throw new Error(`Error uploading catbox:`, error);
  }
}

module.exports.ibb = async (url) => {
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

module.exports.imgur = async (l) => {
    const f = require("fs"), r = require('request');
    try {
        let p, t;
        await new Promise((resolve, reject) => {
            r(l).on('response', function (response) {
                const e = response.headers['content-type'].split('/')[1];
                t = response.headers['content-type'].split('/')[0];
                p = process.cwd() + '/srcipts/cmds/cache' + `/${Date.now()}.${e}`;
                response.pipe(f.createWriteStream(p)).on('finish', resolve).on('error', reject);
            }).on('error', reject);
        });       
        const uploadResponse = await new Promise((resolve, reject) => {
            r({
                method: 'POST',
                url: 'https://api.imgur.com/3/upload',
                headers: {'Authorization': 'Client-ID c76eb7edd1459f3'},
                formData: t === "video" ? {'video': f.createReadStream(p)} : {'image': f.createReadStream(p)}
            }, (e, response, b) => {
                if (e) {reject(e);return;}
                resolve(JSON.parse(b));
            });
        });       
        f.unlink(p, err => { if (err) throw new Error(err); });
        return {link: uploadResponse.data.link};
    } catch (e) { throw new Error(e); }
};

module.exports.findUid = async function(link) {
    try {
        const response = await axios.post('https://seomagnifier.com/fbid',
            new URLSearchParams({
                'facebook': '1',
                'sitelink': link
            }),
            {
                headers: {
                    'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'Cookie': 'PHPSESSID=0d8feddd151431cf35ccb0522b056dc6'
                }
            });       
        if (response.status !== 200) {
            throw new Error('Failed to fetch UID');
        }
        const id = response.data;
        if (isNaN(parseInt(id))) {
            const html = await axios.get(link);
            const $ = cheerio.load(html.data);
            const el = $('meta[property="al:android:url"]').attr('content');
            if (!el) {
                throw new Error('UID not found');
            }
            const number = el.split('/').pop();
            return number;
        }
        return id;
    } catch (error) {
        throw new Error('An unexpected error occurred. Please try again.');
    }
}

module.exports.igpost = async (url, customCookies) => {
    const headers = {
        "accept": "*/*",
        "accept-language": "vi,en-US;q=0.9,en;q=0.8",
        "sec-ch-ua": "\"Chromium\";v=\"106\", \"Microsoft Edge\";v=\"106\", \"Not;A=Brand\";v=\"99\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"Windows\"",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-site",
        "x-asbd-id": "198387",
        "x-csrftoken": "tJk2tDhaeYfUeJRImgbH75Vp6CV6PjtW",
        "x-ig-app-id": "936619743392459",
        "x-ig-www-claim": "hmac.AR1NFmgjJtkM68KRAAwpbEV2G73bqDP45PvNfY8stbZcFiRA",
        "x-instagram-ajax": "1006400422",
        "Referer": "https://www.instagram.com/",
        "Referrer-Policy": "strict-origin-when-cross-origin"
    };
    
    const cookie = customCookies[Math.floor(Math.random() * customCookies.length)];
    headers.cookie = cookie;

    const attachments = [];
    let postData = null;

    if (/^https:\/\/(www\.)?instagram\.com\/stories\//.test(url)) {
      async function getStories(link) {    
    const userAgents =
      [
        "Mozilla/5.0 (Linux; Android 12; F-51B Build/V47RD64B; wv) AppleWebKit/537.36 (KHTML, like Gecko) Ve	Android rsion/4.0 Chrome/108.0.5359.128 Mobile Safari/537.36 Instagram 265.0.0.19.301 Android (31/12; 360dpi; 720x1366; FCNT; F-51B; F51B; qcom; ja_JP; 436384443)",
        "Mozilla/5.0 (Linux; Android 13; Pixel 6a) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.5359.128 Mobile Safari/537.36 Instagram 265.0.0.19.301 Android (31/13; 320dpi; 720x1366; FCNT; F-51B; F51B; qcom; ja_JP; 436384443)",
        "Mozilla/5.0 (Linux; Android 13; Pixel 6a) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.5359.128 Mobile Safari/537.36 Instagram 265.0.0.19.301 Android (31/12; 320dpi; 720x1366; FCNT; F-51B; F51B; qcom; ja_JP; 436384443)",
        "Instagram 264.0.0.22.106 Android (28/9; 160dpi; 800x1232; JOYAR/onn; TBBVNC100005208; TBBVNC100005208; mt8163; en_US; 430370697)	Android	ONN TBBVNC100005208",
        "Mozilla/5.0 (Linux; Android 9; KFONWI Build/PS7326.3183N; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/106.0.5249.170 Safari/537.36 Instagram 253.0.0.23.114 Android (28/9; 213dpi; 800x1216; Amazon; KFONWI; onyx; mt8168; de_DE; 399993134)",
        "Mozilla/5.0 (Linux; Android 9; KFONWI Build/PS7326.3183N; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/106.0.5249.170 Safari/537.36 Instagram 253.0.0.23.114 Android (28/9; 213dpi; 800x1216; Amazon; KFONWI; onyx; mt8168; en_GB; 399993134)9	Explay Onyx",
        "Mozilla/5.0 (Linux; Android 12; F-51B Build/V47RD64B; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/108.0.5359.128 Mobile Safari/537.36 Instagram 265.0.0.19.301 Android (31/12; 320dpi; 720x1366; FCNT; F-51B; F51B; qcom; ja_JP; 436384443)12	Fujitsu Arrows We",
        "Instagram 261.0.0.21.111 Android (30/11; 540dpi; 1080x2137; HMD Global/Nokia; Nokia X100; DM5; qcom; es_US; 418951310)	Android	Nokia Nokia X100",
        "Mozilla/5.0 (Linux; Android 9; KFONWI Build/PS7326.3183N; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/106.0.5249.170 Safari/537.36 Instagram 264.0.0.22.106 Android (28/9; 213dpi; 800x1216; Amazon; KFONWI; onyx; mt8168; de_DE; 430370685)9	Explay Onyx",
        "Mozilla/5.0 (Linux; Android 12; FCG01 Build/V40RK64A; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/108.0.5359.128 Mobile Safari/537.36 Instagram 264.0.0.22.106 Android (31/12; 360dpi; 720x1366; FCNT; FCG01; FCG01; qcom; ja_JP; 430370701)12	Fujitsu Arrows We",
        "Mozilla/5.0 (Linux; Android 9; KFONWI Build/PS7326.3183N; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/106.0.5249.170 Safari/537.36 Instagram 224.2.0.20.116 Android (28/9; 213dpi; 800x1216; Amazon; KFONWI; onyx; mt8168; en_US; 354065894)9	Explay Onyx",
        "Instagram 145.0.0.32.119 Android (29/10; 480dpi; 1080x2264; Realme; RMX1851; RMX1851; qcom; en_US; 219308759)	Android	Realme 3 Pro",
        "Mozilla/5.0 (Linux; Android 9; 7DY Build/PPR1.180610.011; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/108.0.5359.128 Safari/537.36 Instagram 264.0.0.22.106 Android (28/9; 160dpi; 600x976; mediacom; 7DY; 7DY; mt8321; it_IT; 430370684)9	Mediacom 7DY",
        "Mozilla/5.0 (Linux; Android 9; 1CY Build/PPR1.180610.011; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/108.0.5359.128 Safari/537.36 Instagram 264.0.0.22.106 Android (28/9; 160dpi; 800x1232; mediacom; 1CY; 1CY; mt8321; it_IT; 430370684)9	Mediacom 1CY",
        "Mozilla/5.0 (Linux; Android 12; F-51B Build/V47RD64B; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/108.0.5359.128 Mobile Safari/537.36 Instagram 264.0.0.22.106 Android (31/12; 320dpi; 720x1366; FCNT; F-51B; F51B; qcom; ja_JP; 430370627)12	Fujitsu Arrows We",
        "Mozilla/5.0 (Linux; Android 5.1; B1-723 Build/LMY47I; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/95.0.4638.74 Safari/537.36 Instagram 264.0.0.22.106 Android (22/5.1; 160dpi; 600x976; Acer/acer; B1-723; oban; mt6580; it_IT; 430370684)5	Acer Iconia Talk 7",
        "Mozilla/5.0 (Linux; Android 11; FCG01 Build/V14RK61D; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/108.0.5359.128 Mobile Safari/537.36 Instagram 264.0.0.22.106 Android (30/11; 320dpi; 720x1366; FCNT; FCG01; FCG01; qcom; ja_JP; 430370701)11	Fujitsu Arrows We",
        "Mozilla/5.0 (Linux; Android 9; 7DY Build/PPR1.180610.011; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/108.0.5359.128 Safari/537.36 Instagram 263.2.0.19.104 Android (28/9; 160dpi; 600x976; mediacom; 7DY; 7DY; mt8321; it_IT; 428413120)9	Mediacom 7DY",
        "Mozilla/5.0 (Linux; Android 12; F-51B Build/V47RD64B; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/108.0.5359.128 Mobile Safari/537.36 Instagram 264.0.0.22.106 Android (31/12; 320dpi; 720x1366; FCNT; F-51B; F51B; qcom; ja_JP; 430370703)12	Fujitsu Arrows We",
        "Mozilla/5.0 (Linux; Android 9; KFONWI Build/PS7326.3183N; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/106.0.5249.170 Safari/537.36 Instagram 253.0.0.23.114 Android (28/9; 213dpi; 800x1216; Amazon; KFONWI; onyx; mt8168; en_CA; 399993134)"
      ];
  function extractId(url) {
        const regex = /\/stories\//;
        const match = url.match(regex);
        if (match) {
            const username = match[1];
            const postId = match[2];
            return { username, postId };
        } else {
            return null;
           }
    }
    async function getUserId(url) {
        const username = await extractId(url).username;
        try {
            const response = await axios.get(`https://i.instagram.com/api/v1/users/web_profile_info/?username=${username}`, {
                headers: {
                    'User-Agent': userAgents[Math.floor(Math.random() * userAgents.length)],
                    'Accept': '*/*',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Cookie': global.account.ig,
                'X-Instagram-AJAX': '1',
                'X-IG-App-ID': '936619743392459',
                "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
                "accept-language": "vi,en;q=0.9,en-GB;q=0.8,en-US;q=0.7",
                "cache-control": "max-age=0",
                "sec-ch-prefers-color-scheme": "dark",
                "sec-ch-ua": "\"Not_A Brand\";v=\"99\", \"Microsoft Edge\";v=\"109\", \"Chromium\";v=\"109\"",
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": "\"Windows\"",
                "sec-fetch-dest": "document",
                "sec-fetch-mode": "navigate",
                "sec-fetch-site": "none",
                "sec-fetch-user": "?1",
                "upgrade-insecure-requests": "1",
                }
            });
            return response.data.data.user.id;
        } catch (error) {
            console.error('Lỗi khi lấy userId:', error.response ? error.response.data : error.message);
        }
    }
    try {
        const userId = await getUserId(link);
        if (!userId) {
            return;
        }
        const extractCsrf = (cookies) => {
             for (const cookie of cookies) {
             const match = cookie.match(/csrftoken=([^;]+)/);
            if (match) {
            return match[1];
          }
       }
       return null;
     };
     const response = await axios.get(`https://i.instagram.com/api/v1/feed/user/${userId}/story/`, {
            headers: {
                'User-Agent': userAgents[Math.floor(Math.random() * userAgents.length)],
                'Accept': '*/*',
                'Accept-Language': 'en-US,en;q=0.9',
                'Cookie': global.account.ig,
                'X-Instagram-AJAX': '1',
                'X-IG-App-ID': '936619743392459',
                "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
                "accept-language": "vi,en;q=0.9,en-GB;q=0.8,en-US;q=0.7",
                "cache-control": "max-age=0",
                "sec-ch-prefers-color-scheme": "dark",
                "sec-ch-ua": "\"Not_A Brand\";v=\"99\", \"Microsoft Edge\";v=\"109\", \"Chromium\";v=\"109\"",
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": "\"Windows\"",
                "sec-fetch-dest": "document",
                "sec-fetch-mode": "navigate",
                "sec-fetch-site": "none",
                "sec-fetch-user": "?1",
                "upgrade-insecure-requests": "1",
            }
        });
        const postID = await extractId(link).postId;
        const data = response.data.reel.items;
        function getDataById(postID) {
          return data.find(item => item.pk === postID);
        }
        const dataStories = await getDataById(postID);
        let medias = [];
        if (dataStories.video_versions && dataStories.video_versions.length > 0) {
      medias.push({
         type: "Video",
         url: dataStories.video_versions[0].url
           });
        } else if (dataStories.image_versions2 && dataStories.image_versions2.candidates && dataStories.image_versions2.candidates.length > 0) {
     medias.push({
        type: "Photo",
        url: dataStories.image_versions2.candidates[0].url
          });
       }
        return { data: medias };
    } catch (error) {
        console.error('Lỗi khi lấy stories:', error.response ? error.response.data : error.message);
    }
}
      const storyData = await getStories(url);

if (storyData && storyData.data && storyData.data.length > 0) {
  attachments.push(...storyData.data.map(story => ({
    type: story.type,
    url: story.url
  })));
}
    } else {
        try {
            const res__ = await axios.get(url, { headers });
            const data = res__.data;
            const postId = data.match(/instagram:\/\/media\?id=(\d+)/)?.[1];
            if (!postId) throw new Error("Not found");

            const res = await axios.get(`https://www.instagram.com/api/v1/media/${postId}/info/`, { headers });
            delete headers.cookie;

            const info = res.data.items?.[0] || {};
            const dataReturn = {
                images: [],
                videos: []
            };

            if (info.video_versions) {
                dataReturn.videos = [info.video_versions[info.video_versions.length - 1].url];
            } else {
                const allImage = info.carousel_media || [{ image_versions2: res.data.image_versions2 || info.image_versions2 }];
                dataReturn.images = allImage.map(item => item.image_versions2.candidates[0].url);
            }

            postData = {
                ...dataReturn,
                caption: info.caption?.text || "",
                owner: {
                    id: info.user.pk,
                    username: info.user.username,
                    full_name: info.user.full_name,
                    profile_pic_url: info.user.profile_pic_url
                },
                like_count: info.like_count,
                comment_count: info.comment_count,
                created_at: info.taken_at,
                media_type: info.media_type,
                originalData: info
            };

            if (postData.images && postData.images.length > 0) {
                attachments.push(...postData.images.map(imageUrl => ({
                    type: "Photo",
                    url: imageUrl
                })));
            } else if (postData.videos && postData.videos.length > 0) {
                attachments.push(...postData.videos.map(videoUrl => ({
                    type: "Video",
                    url: videoUrl
                })));
            }
        } catch (error) {
            console.error(error);
            throw new Error("Failed to fetch post data");
        }
    }

    return {
        message: postData?.caption || null,
        author: postData ? `${postData.owner.full_name} (${postData.owner.username})` : null,
        like: postData?.like_count || null,
        comment: postData?.comment_count || null,
        attachments
    };
};

module.exports.fbpost = async function(url) {
    const cache = {};
    const isURL = url => /^http(s|):\/\//.test(url);
    const isFB = url => /^http(|s):\/\/([^]*)(facebook|fb)\.(com|watch)\//.test(url);
    if (!url || !isURL(url)) return 'Chưa Nhập Liên Kết Bài Đăng.';
    if (!isFB(url)) return 'Liên Kết Chưa Xác Định.';
    if (/story\.php/.test(url)) url = url.replace('://m', '://www');
    try {
        let data = cache[url] || await axios({
            method: 'get',
            url: url,
            headers: {
                "accept": "text/html, application/xhtml+xml, application/xml;q=0.9, */*;q=0.8",
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'same-origin',
                'Sec-Fetch-User': '?1',
                "encoding": "gzip",
                "cookie": global.account.cookie,
                "user-agent": "Mike ozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.198 Safari/537.36",
            },
        }).then(response => response.data.split(/data\-sjs>|<\/script>/).filter(data => /^\{"require":/.test(data)).map(data => JSON.parse(data)));
        cache[url] = data;
        const repData = {
            message: '',
            attachment: [],
        };
        let _ = allValueByKey(data, [['attachment'], ['attachments'], ['message'], ['unified_stories'], ['video'], ['five_photos_subattachments']]);
        let msg = (i, m = _.message) => m?.[i]?.story?.message?.text || m?.[i]?.text;
        repData.message = msg(2) || msg(0) || null;
        if (/(\/reel\/|watch)/.test(url)) {
            if (_.attachments.length > 0 && _.attachments[0][0]?.media && typeof _.attachments[0][0].media == 'object') repData.attachment.push(_.attachments[0][0].media);
            else if (_.video.length > 0) repData.attachment.push(({ __typename: 'Video', ..._.video[0] }));
        }
        if (/\/stories\//.test(url)) {
            for (let i of _.unified_stories)
                for (let e of i.edges) {
                    let media_story = e?.node?.attachments?.[0]?.media;
                    if (!!media_story) repData.attachment.push(media_story);
                }
        }
        if (/\/((posts|share|permalink|videos)\/|story\.php)/.test(url)) {
            let a = _.attachment;
            let fpsa = _.five_photos_subattachments[0]?.nodes;
            let b = a?.[0]?.all_subattachments?.nodes || (fpsa?.[0] ? fpsa : fpsa) || (a?.[0] ? [a[0]] : []);
            repData.attachment.push(...b.map($ => {
                let vd = $?.media?.video_grid_renderer;
                if (!!vd && $.media) delete $.media.video_grid_renderer;
                return {
                    ...$.media,
                    ...(vd?.video || {}),
                };
            }));
            if (_.attachments.length > 0) repData.attachment.push(_.attachments[0][0]?.media);
        }
        repData.attachment = repData.attachment.filter($ => !!$).map($ => newObjByKey($, ['__typename', 'id', 'preferred_thumbnail', 'browser_native_sd_url', 'browser_native_hd_url', 'image', 'photo_image', 'owner']));
        return repData;
    } catch (error) {
        throw new Error(`Lỗi khi truy xuất dữ liệu: ${error.message}`);
    }
}
function allValueByKey(obj, allKey) {
    let returnData = {};
    function check(obj, key) {
        if (!returnData[key]) returnData[key] = [];
        for (let $ of Object.entries(obj)) {
            if ($[0] == key && !returnData[key].some($1 => JSON.stringify($1) == JSON.stringify($[1]))) returnData[key].push($[1]);
            if (!!$[1] && typeof $[1] == 'object') check($[1], key);
        }
    }
    allKey.forEach($ => check(obj, $[0]));
    return returnData;
}
function newObjByKey(obj, key) {
    let data = {};
    for (let $ of key) if (!!obj[$]) data[$] = obj[$];   
    return data;
}

module.exports.fbvideo = async(videoUrl) => {
 function decodeHTML(html) {
    return html.replace(/&#(\d+);/g, function(match, dec) {
        return String.fromCharCode(dec);
    });
};
  const headers = {
    "sec-fetch-user": "?1",
    "sec-ch-ua-mobile": "?0",
    "sec-fetch-site": "none",
    "sec-fetch-dest": "document",
    "sec-fetch-mode": "navigate",
    "cache-control": "max-age=0",
    authority: "www.facebook.com",
    "upgrade-insecure-requests": "1",
    "accept-language": "en-GB,en;q=0.9,tr-TR;q=0.8,tr;q=0.7,en-US;q=0.6",
    "sec-ch-ua": '"Google Chrome";v="89", "Chromium";v="89", ";Not A Brand";v="99"',
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.114 Safari/537.36",
    accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
    cookie: global.account.cookie,
  };
  const parseString = (string) => JSON.parse(`{"text": "${string}"}`).text;
  if (!videoUrl || !videoUrl.trim()) throw new Error("Please specify the Facebook URL");
  if (["facebook.com", "fb.watch"].every((domain) => !videoUrl.includes(domain))) throw new Error("Vui lòng nhập URL Facebook hợp lệ");
  try {
    const { data } = await axios.get(videoUrl, { headers });
    let sdMatch = data.match(/"browser_native_sd_url":"(.*?)"/) || data.match(/"playable_url":"(.*?)"/) || data.match(/sd_src\s*:\s*"([^"]*)"/) || data.match(/(?<="src":")[^"]*(https:\/\/[^"]*)/);
    let hdMatch = data.match(/"browser_native_hd_url":"(.*?)"/) || data.match(/"playable_url_quality_hd":"(.*?)"/) || data.match(/hd_src\s*:\s*"([^"]*)"/);
    let titleMatch = data.match(/<meta\sname="description"\scontent="(.*?)"/);
    let thumbMatch = data.match(/"preferred_thumbnail":{"image":{"uri":"(.*?)"/);
    sdMatch = sdMatch && sdMatch[1] ? parseString(sdMatch[1]) : "";
    hdMatch = hdMatch && hdMatch[1] ? parseString(hdMatch[1]) : "";
    const titleOr = titleMatch && titleMatch[1] ? parseString(titleMatch[1]) : data.match(/<title>(.*?)<\/title>/)?.[1] ?? "";
    const title = decodeHTML(titleOr);
    const thumbnail = thumbMatch && thumbMatch[1] ? parseString(thumbMatch[1]) : "";
    return {
      url: videoUrl,
      sd: sdMatch,
      hd: hdMatch,
      title,
      thumbnail,
    };
  } catch (error) {
    throw new Error("Không thể tìm nạp thông tin video vào lúc này. Vui lòng thử lại");
  }
};

module.exports.threadsdl = async function(link) {
  function getIDThread(link) {
    const regex = /\/post\/([^\/]+)\/?/;
    const match = link.match(regex);
    if (match && match[1]) {
        return match[1];
    }
   return null;
 }
    const id = getIDThread(link);
    try {
        const response = await axios.get(`https://data.threadster.site/results/${id}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.5005.63 Safari/537.36',
                'Accept': 'application/json',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate',
                'Connection': 'keep-alive'
            }
        });
        const data = response.data.data;
        const results = [];
        if (data.media && data.media.length > 0) {
            data.media.forEach(media => {
                if (media.image_url) {
                    results.push({
                        type: 'image',
                        url: media.image_url
                    });
                } else if (media.video_url) {
                    results.push({
                        type: 'video',
                        url: media.video_url
                    });
                }
            });
        }
        const title = data.full_text;
        const user = {
            username: data.user.username,
            profile_pic_url: data.user.profile_pic_url
        };
        const likes = data.meta.likes;
        const created_at = data.meta.created_at;
        const replies = data.meta.replies;
        const isVerified = data.meta.isVerified;
        return { title, user, results, likes, created_at, replies, isVerified };
    } catch (error) {
        throw new Error('Error fetching data:', error);
    }
}

module.exports.aiodl = async function(url) {
  try {
    const response = await axios.post("https://aiovd.com/wp-json/aio-dl/video-data", { url: url }, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36 Edg/109.0.1518.55'
    }});
    const res = response.data;
    const result = {
      data: res.medias
    };
    return result;
  } catch (error) {
    console.error("Error calling aiodl:", error);
    throw error;
  }
}

module.exports.twdl = async function(url, options) {
    try {
        let input = {};
        if (typeof url === 'object') {
            if (url.url) input = url;
            else return { found: false, error: 'Không có URL nào được cung cấp' };
        } else if (typeof url === 'string') {
            input.url = url;
        } else {
            return { found: false, error: 'Đối số đầu tiên không hợp lệ' };
        }
        if (options) Object.assign(input, options);
        if (/twitter\.com|x\.com/.test(input.url)) {
            const apiURL = input.url.replace(/twitter\.com|x\.com/g, 'api.vxtwitter.com');
            const result = await axios.get(apiURL).then(res => res.data).catch(() => {
                throw new Error('Đã xảy ra sự cố. Đảm bảo liên kết Twitter hợp lệ.');
            });
            if (!result.media_extended) return { found: false, error: 'Không tìm thấy phương tiện nào' };
            const output = {
                found: true,
                type: result.media_extended[0].type,
                media: result.mediaURLs
            };
            if (input.text) 
            output.title = result.text;
            output.id = result.conversationID;
            output.date = result.date;
            output.likes = result.likes;
            output.replies = result.replies;
            output.retweets = result.retweets;
            output.author = result.user_name;
            output.username = result.user_screen_name;
            return output;
        } else {
            return { found: false, error: `URL không hợp lệ: ${input.url}` };
        }
    } catch (error) {
        return { found: false, error: error.message };
    }
};

module.exports.simi = function(type, data) {
  const dataSimPath = path.join(__dirname, 'src', 'datasim.json');
  if (!fs.existsSync(dataSimPath)) fs.writeFileSync(dataSimPath, '[]', 'utf-8');
  const dataSim = require(dataSimPath);
  if (type === 'ask') {
    const ask = encodeURI(data);
    const msg = dataSim.map(id => id.ask);
    const checker = stringSimilarity.findBestMatch(decodeURI(ask), msg);
    if (checker.bestMatch.rating < 0.5) return { answer: '' };
    const search = checker.bestMatch.target.toLowerCase();
    const find = dataSim.filter(i => i.ask.toLowerCase() === search);
    const f2 = find[Math.floor(Math.random() * find.length)];
    const a = f2.ans[Math.floor(Math.random() * f2.ans.length)];
    return { answer: a };
  } else if (type === 'teach') {
    const { ask, ans } = data;
    if (!ask || !ans) return { error: 'Thiếu dữ liệu để thực thi lệnh' };
    const existingQuestion = dataSim.find(i => i.ask === ask);
    if (existingQuestion && existingQuestion.ans.includes(ans)) return { error: 'Câu trả lời đã tồn tại!' };
    if (existingQuestion) existingQuestion.ans.push(ans);
    else dataSim.push({ id: dataSim.length, ask, ans: [ans] });
    fs.writeFileSync(dataSimPath, JSON.stringify(dataSim, null, 2), 'utf-8');
    return { msg: 'Dạy sim thành công', data: { ask, ans } };
  } else if (type === 'delete') {
    const { ask, ans } = data;
    if (!ask || !ans) return { error: 'Thiếu dữ liệu để thực thi lệnh' };
    const existingQuestion = dataSim.find(i => i.ask === ask);
    if (!existingQuestion || !existingQuestion.ans.includes(ans)) return { error: 'Không tìm thấy câu trả lời để xóa' };
    const ansIndex = existingQuestion.ans.indexOf(ans);
    existingQuestion.ans.splice(ansIndex, 1);
    fs.writeFileSync(dataSimPath, JSON.stringify(dataSim, null, 2), 'utf-8');
    return { msg: 'Xóa câu trả lời thành công' };
  }
}

module.exports.igstr = async function(url) {
  try {
      const userAgents =
	[
		"Mozilla/5.0 (Linux; Android 12; F-51B Build/V47RD64B; wv) AppleWebKit/537.36 (KHTML, like Gecko) Ve	Android rsion/4.0 Chrome/108.0.5359.128 Mobile Safari/537.36 Instagram 265.0.0.19.301 Android (31/12; 360dpi; 720x1366; FCNT; F-51B; F51B; qcom; ja_JP; 436384443)",
		"Mozilla/5.0 (Linux; Android 13; Pixel 6a) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.5359.128 Mobile Safari/537.36 Instagram 265.0.0.19.301 Android (31/13; 320dpi; 720x1366; FCNT; F-51B; F51B; qcom; ja_JP; 436384443)",
		"Mozilla/5.0 (Linux; Android 13; Pixel 6a) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.5359.128 Mobile Safari/537.36 Instagram 265.0.0.19.301 Android (31/12; 320dpi; 720x1366; FCNT; F-51B; F51B; qcom; ja_JP; 436384443)",
		"Instagram 264.0.0.22.106 Android (28/9; 160dpi; 800x1232; JOYAR/onn; TBBVNC100005208; TBBVNC100005208; mt8163; en_US; 430370697)	Android	ONN TBBVNC100005208",
		"Mozilla/5.0 (Linux; Android 9; KFONWI Build/PS7326.3183N; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/106.0.5249.170 Safari/537.36 Instagram 253.0.0.23.114 Android (28/9; 213dpi; 800x1216; Amazon; KFONWI; onyx; mt8168; de_DE; 399993134)",
		"Mozilla/5.0 (Linux; Android 9; KFONWI Build/PS7326.3183N; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/106.0.5249.170 Safari/537.36 Instagram 253.0.0.23.114 Android (28/9; 213dpi; 800x1216; Amazon; KFONWI; onyx; mt8168; en_GB; 399993134)9	Explay Onyx",
		"Mozilla/5.0 (Linux; Android 12; F-51B Build/V47RD64B; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/108.0.5359.128 Mobile Safari/537.36 Instagram 265.0.0.19.301 Android (31/12; 320dpi; 720x1366; FCNT; F-51B; F51B; qcom; ja_JP; 436384443)12	Fujitsu Arrows We",
		"Instagram 261.0.0.21.111 Android (30/11; 540dpi; 1080x2137; HMD Global/Nokia; Nokia X100; DM5; qcom; es_US; 418951310)	Android	Nokia Nokia X100",
		"Mozilla/5.0 (Linux; Android 9; KFONWI Build/PS7326.3183N; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/106.0.5249.170 Safari/537.36 Instagram 264.0.0.22.106 Android (28/9; 213dpi; 800x1216; Amazon; KFONWI; onyx; mt8168; de_DE; 430370685)9	Explay Onyx",
		"Mozilla/5.0 (Linux; Android 12; FCG01 Build/V40RK64A; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/108.0.5359.128 Mobile Safari/537.36 Instagram 264.0.0.22.106 Android (31/12; 360dpi; 720x1366; FCNT; FCG01; FCG01; qcom; ja_JP; 430370701)12	Fujitsu Arrows We",
		"Mozilla/5.0 (Linux; Android 9; KFONWI Build/PS7326.3183N; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/106.0.5249.170 Safari/537.36 Instagram 224.2.0.20.116 Android (28/9; 213dpi; 800x1216; Amazon; KFONWI; onyx; mt8168; en_US; 354065894)9	Explay Onyx",
		"Instagram 145.0.0.32.119 Android (29/10; 480dpi; 1080x2264; Realme; RMX1851; RMX1851; qcom; en_US; 219308759)	Android	Realme 3 Pro",
		"Mozilla/5.0 (Linux; Android 9; 7DY Build/PPR1.180610.011; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/108.0.5359.128 Safari/537.36 Instagram 264.0.0.22.106 Android (28/9; 160dpi; 600x976; mediacom; 7DY; 7DY; mt8321; it_IT; 430370684)9	Mediacom 7DY",
		"Mozilla/5.0 (Linux; Android 9; 1CY Build/PPR1.180610.011; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/108.0.5359.128 Safari/537.36 Instagram 264.0.0.22.106 Android (28/9; 160dpi; 800x1232; mediacom; 1CY; 1CY; mt8321; it_IT; 430370684)9	Mediacom 1CY",
		"Mozilla/5.0 (Linux; Android 12; F-51B Build/V47RD64B; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/108.0.5359.128 Mobile Safari/537.36 Instagram 264.0.0.22.106 Android (31/12; 320dpi; 720x1366; FCNT; F-51B; F51B; qcom; ja_JP; 430370627)12	Fujitsu Arrows We",
		"Mozilla/5.0 (Linux; Android 5.1; B1-723 Build/LMY47I; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/95.0.4638.74 Safari/537.36 Instagram 264.0.0.22.106 Android (22/5.1; 160dpi; 600x976; Acer/acer; B1-723; oban; mt6580; it_IT; 430370684)5	Acer Iconia Talk 7",
		"Mozilla/5.0 (Linux; Android 11; FCG01 Build/V14RK61D; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/108.0.5359.128 Mobile Safari/537.36 Instagram 264.0.0.22.106 Android (30/11; 320dpi; 720x1366; FCNT; FCG01; FCG01; qcom; ja_JP; 430370701)11	Fujitsu Arrows We",
		"Mozilla/5.0 (Linux; Android 9; 7DY Build/PPR1.180610.011; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/108.0.5359.128 Safari/537.36 Instagram 263.2.0.19.104 Android (28/9; 160dpi; 600x976; mediacom; 7DY; 7DY; mt8321; it_IT; 428413120)9	Mediacom 7DY",
		"Mozilla/5.0 (Linux; Android 12; F-51B Build/V47RD64B; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/108.0.5359.128 Mobile Safari/537.36 Instagram 264.0.0.22.106 Android (31/12; 320dpi; 720x1366; FCNT; F-51B; F51B; qcom; ja_JP; 430370703)12	Fujitsu Arrows We",
		"Mozilla/5.0 (Linux; Android 9; KFONWI Build/PS7326.3183N; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/106.0.5249.170 Safari/537.36 Instagram 253.0.0.23.114 Android (28/9; 213dpi; 800x1216; Amazon; KFONWI; onyx; mt8168; en_CA; 399993134)"
	];
      const response = await axios.get(url, {
          headers: {
            "user-agent": userAgents[Math.floor(Math.random() * userAgents.length)],
            "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
            "accept-language": "vi,en;q=0.9,en-GB;q=0.8,en-US;q=0.7",
            "cache-control": "max-age=0",
            "sec-ch-prefers-color-scheme": "dark",
            "sec-ch-ua": "\"Not_A Brand\";v=\"99\", \"Microsoft Edge\";v=\"109\", \"Chromium\";v=\"109\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "sec-fetch-dest": "document",
            "sec-fetch-mode": "navigate",
            "sec-fetch-site": "none",
            "sec-fetch-user": "?1",
            "upgrade-insecure-requests": "1",
            "cookie": 'ig_did=2525D6F7-5F8C-41BE-B7D3-471B76117E45; ig_nrcb=1; mid=ZQBxjQABAAEWLZfJlX17xVoEIGK-; datr=inEAZRyW3nX84llBdiobsbp7; fbm_124024574287414=base_domain=.instagram.com; ps_n=1; ps_l=1; shbid="3486\05466021432161\0541747310824:01f70f8faa2e568c9b065bc1fb965231d5da5abef9d597c3d8e1b1e07863011a8144aa34"; shbts="1715774824\05466021432161\0541747310824:01f7988c13f47f14010023a4abcc7d36af6ce0294f1edd2482a57def5c3c23518e41a823"; dpr=1.5294095277786255; wd=471x894; fbsr_124024574287414=E3mZkQw6-VZT-afnWaiTGYvP-P6UWbWE1iwQEEwqZXw.eyJ1c2VyX2lkIjoiMTAwMDY4MDk2MzcwNDM3IiwiY29kZSI6IkFRQ0k0NmhDT2JEcVYydFdDT212YkRXNm82Sm5TNkZvUFVIMVNsN0FTVTNxSDJ2aTdVY1h4aEdKcjlobTJSdmJzQl9SY3FrR2tRMzM4MXJuY3pjWkl0dW45M3BLcHktRENtbW5kUVloT1RrdFIxRVA3YTZDMFFlVmRNT1J6dXUtT3g3SFVBemh0Vmw2SUE2VFhFejd6cU5ja3FWR0I4ZmJselFLdUlHdkV2Qmp1UU5sdXlaUVJrTFpZTTV6UFF6d1M0bFU0OFh0SDZ5cFQxS3IyLVNmdXptVmJ2Zl9YY0twdXp4TFhkZDNlTm5fajFkeHFPdkJKMi0yM2Zwd3JqVEoyX0IxbmZURmJoUHR6Q0JqMWdTeFJHSm5RSU94SEdKNzdiRExVa28wZll4dmVrTnZpeEtVWkd0akcxS3I2TWF1UlBKWC11OUFITDJPOUxjWmF5VUlzbXJPIiwib2F1dGhfdG9rZW4iOiJFQUFCd3pMaXhuallCTzYzcnkwSUh1RTc3SDVxRkxIWkFoWUppeTFTY2JZZHhXcEk4bUR4bHFzVmY1YlNHODEzRGVDWXF3MjI1OFRTdld0Z1lFOEhlUDJDZHFXc1lnUXlTYksyd2t5alZEaTNvWWdEWkNKTVJwdDFyOUlhVWhlaEZ5eHlVNmZ1Rkw5QzExa0dpYnJxcm5Gc1pBMExQdmdqaUduOVFrSmdJSnhkcmRTa1pCd0dXMXZ0b252UlNlUGpPMTJRWkQiLCJhbGdvcml0aG0iOiJITUFDLVNIQTI1NiIsImlzc3VlZF9hdCI6MTcxNTkyNTk2Nn0; csrftoken=A6pXk2ke6UN4EGv5g0MdJ3nyaCuisxIv; ds_user_id=52157007740; sessionid=52157007740%3AavN7JfHVWPPm4S%3A7%3AAYcRLHWIJpaIszgksZDgoxzGQ50MvRodOurWCpv53g; fbsr_124024574287414=E3mZkQw6-VZT-afnWaiTGYvP-P6UWbWE1iwQEEwqZXw.eyJ1c2VyX2lkIjoiMTAwMDY4MDk2MzcwNDM3IiwiY29kZSI6IkFRQ0k0NmhDT2JEcVYydFdDT212YkRXNm82Sm5TNkZvUFVIMVNsN0FTVTNxSDJ2aTdVY1h4aEdKcjlobTJSdmJzQl9SY3FrR2tRMzM4MXJuY3pjWkl0dW45M3BLcHktRENtbW5kUVloT1RrdFIxRVA3YTZDMFFlVmRNT1J6dXUtT3g3SFVBemh0Vmw2SUE2VFhFejd6cU5ja3FWR0I4ZmJselFLdUlHdkV2Qmp1UU5sdXlaUVJrTFpZTTV6UFF6d1M0bFU0OFh0SDZ5cFQxS3IyLVNmdXptVmJ2Zl9YY0twdXp4TFhkZDNlTm5fajFkeHFPdkJKMi0yM2Zwd3JqVEoyX0IxbmZURmJoUHR6Q0JqMWdTeFJHSm5RSU94SEdKNzdiRExVa28wZll4dmVrTnZpeEtVWkd0akcxS3I2TWF1UlBKWC11OUFITDJPOUxjWmF5VUlzbXJPIiwib2F1dGhfdG9rZW4iOiJFQUFCd3pMaXhuallCTzYzcnkwSUh1RTc3SDVxRkxIWkFoWUppeTFTY2JZZHhXcEk4bUR4bHFzVmY1YlNHODEzRGVDWXF3MjI1OFRTdld0Z1lFOEhlUDJDZHFXc1lnUXlTYksyd2t5alZEaTNvWWdEWkNKTVJwdDFyOUlhVWhlaEZ5eHlVNmZ1Rkw5QzExa0dpYnJxcm5Gc1pBMExQdmdqaUduOVFrSmdJSnhkcmRTa1pCd0dXMXZ0b252UlNlUGpPMTJRWkQiLCJhbGdvcml0aG0iOiJITUFDLVNIQTI1NiIsImlzc3VlZF9hdCI6MTcxNTkyNTk2Nn0; rur="EAG\05452157007740\0541747461980:01f7689a0888489c8364da5623e4bd7e290d71fbe3aba49c15970b200628ed9302c0970e"; useragent=TW96aWxsYS81LjAgKExpbnV4OyBBbmRyb2lkIDEwOyBLKSBBcHBsZVdlYktpdC81MzcuMzYgKEtIVE1MLCBsaWtlIEdlY2tvKSBDaHJvbWUvMTIwLjAuMC4wIE1vYmlsZSBTYWZhcmkvNTM3LjM2; _uafec=Mozilla%2F5.0%20(Linux%3B%20Android%2010%3B%20K)%20AppleWebKit%2F537.36%20(KHTML%2C%20like%20Gecko)%20Chrome%2F120.0.0.0%20Mobile%20Safari%2F537.36;'
         }
      });
    const html = response.data;
    const regex = /<script[^>]*type\s*=\s*["']application\/json["'][^>]*>([\s\S]*?)<\/script>/g;
    const jsonScripts = Array.from(html.matchAll(regex), match => {
        const jsonString = match[1].trim();
        return jsonString ? JSON.parse(jsonString) : null;
    }).filter(json => json !== null);
      const filteredData = jsonScripts.filter(jsonData =>
          jsonData && jsonData.require && jsonData.require[0] && jsonData.require[0][0] === "ScheduledServerJS");
      const linkId = url.match(/stories\/[^/]+\/(\d+)\??/)[1];
      const stories = filteredData[2]?.require[0][3][0]?.__bbox?.require[0][3][1]?.__bbox.result.data.xdt_api__v1__feed__reels_media.reels_media[0].items.filter(item => item.pk === linkId) || [];
      const videosInfo = [];
      if (stories.length > 0) {
          stories.forEach(data => {
              const videoInfo = {
                  title: data.caption ? data.caption.text : "null",
                  duration: data.video_duration,
                  create_at: new Date(data.taken_at * 1000),
                  link: data.video_versions === null ? data.image_versions2.candidates[0].url : data.video_versions[0].url
              };
              videosInfo.push(videoInfo);
          });
      } else {
          throw new Error("Không tìm thấy dữ liệu phù hợp trong Instagram story");
      }
      return videosInfo;
  } catch (error) {
      throw new Error("Lỗi khi fetch Instagram story: " + error);
  }
}

module.exports.capcuts = async function(keyword) {
  if (!keyword) throw new Error('Thiếu dữ liệu để khởi chạy chương trình');
  const options = {
            method: 'POST',
            url: 'https://edit-api-sg.capcut.com/lv/v1/cc_web/replicate/search_templates',
            headers: {
                'Host': 'edit-api-sg.capcut.com',
                'Content-Type': 'application/json',
                'accept-language': 'vi-VN,vi;q=0.9,fr-FR;q=0.8,fr;q=0.7,en-US;q=0.6,en;q=0.5',
                'app-sdk-version': '48.0.0',
                 appvr: '5.8.0',
                'cookie': '_ga=GA1.1.382841626.1704093538; _clck=udqiju%7C2%7Cfi1%7C0%7C1461; passport_csrf_token=01a7a2ffdee0c9c90c25c96c74c3c30a; passport_csrf_token_default=01a7a2ffdee0c9c90c25c96c74c3c30a; passport_auth_status=fa3fafccdbf54b72a5ae969153a8367c%2C; passport_auth_status_ss=fa3fafccdbf54b72a5ae969153a8367c%2C; sid_guard=d7a0d457a8ccbd28c80d9eb4c9da3a45%7C1704093581%7C34560000%7CTue%2C+04-Feb-2025+07%3A19%3A41+GMT; uid_tt=2911adf660e32d4908db5d59a794e00a60aafee969aff391ec0b4538fe56b680; uid_tt_ss=2911adf660e32d4908db5d59a794e00a60aafee969aff391ec0b4538fe56b680; sid_tt=d7a0d457a8ccbd28c80d9eb4c9da3a45; sessionid=d7a0d457a8ccbd28c80d9eb4c9da3a45; sessionid_ss=d7a0d457a8ccbd28c80d9eb4c9da3a45; sid_ucp_v1=1.0.0-KGMwZGQ2ZDc2YzQzNzBlZjNhYThmNWFjNGFlMGVmYzY5ODNiOTA2OGEKIAiCiK_K0u2ZyWUQjc_JrAYYnKAVIAwwjc_JrAY4CEASEAMaA3NnMSIgZDdhMGQ0NTdhOGNjYmQyOGM4MGQ5ZWI0YzlkYTNhNDU; ssid_ucp_v1=1.0.0-KGMwZGQ2ZDc2YzQzNzBlZjNhYThmNWFjNGFlMGVmYzY5ODNiOTA2OGEKIAiCiK_K0u2ZyWUQjc_JrAYYnKAVIAwwjc_JrAY4CEASEAMaA3NnMSIgZDdhMGQ0NTdhOGNjYmQyOGM4MGQ5ZWI0YzlkYTNhNDU; store-idc=alisg; store-country-code=vn; store-country-code-src=uid; odin_tt=f0f86a4fba8632aac92b736a20a51eea7b68464e0e6e8f36504001c2863c987d35e356093ad7c65cc41c4ee3d011a08d37b531eec47f6ada19a8bd0780acccd0; csrf_session_id=a837de9ddb8e5a4e263bad23c1453480; ttwid=1|2P_Y7hiaQHOgRN2dfMNzFES4MewtjPWkZKughSH8Sjs|1704116592|c038d929f11a4ce2bc34850c5e38f5957b008cbef30e5103a2fbef9cceb27f05; _uetsid=0830e720a87611ee9d58776762c93b1d; _uetvid=08345970a87611eebf7e650c56cc879e; _ga_F9J0QP63RB=GS1.1.1704116587.7.1.1704116598.0.0.0; _clsk=jq6pma%7C1704116600519%7C1%7C0%7Cy.clarity.ms%2Fcollect; msToken=sj6PJlGDkuSAJAkgVRcGlc_divtmWrAboGYd-zzn3ZN1O-rAksovTw4JTyBiNyvDLgpsAyIuAuQo8pZwpv2PhhBQqhMm9Bm3q3j0Mqt8NTLo',
                'device-time': '1704116611',
                 lan: 'vi-VN',
                 loc: 'va',
                'origin': 'https://www.capcut.com',
                 pf: '7',
                 referer: 'https://www.capcut.com/',
                'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-site',
                'sign': '6edde988911c68544a053e83f0e3b814',
                'sign-ver': '1',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
    data: JSON.stringify({
      'sdk_version': '86.0.0',
      'count': 20,
      'cursor': '0',
      'enter_from': 'workspace',
      'query': keyword,
      'scene': 1,
      'search_version': 2,
      'cc_web_version': 1
    }),
  };
 try {
    const response = await axios.request(options);
    return response.data.data;
  } catch (error) {
    throw new Error('Gãy rồi huhu...');
  }
}

module.exports.capcutinfo = async function(url) {
    try {
        const getUrl = await axios.get(url);
        const get = getUrl.request.res.responseUrl;
        const urls = get.split("=")[1].split("&")[0];
        if (!urls) {
            throw new Error("Không thể trích xuất URL từ phản hồi");
        }        
        const data = {
            'public_id': urls
        };        
        const options = {
            method: 'POST',
            url: 'http://feed-api.capcutapi.com/lv/v1/homepage/profile',
            data: data,
            headers: {
                'Connection': 'keep-alive',
                'Content-Length': Buffer.byteLength(JSON.stringify(data)),
                'Accept-Language': 'vi-VN,vi;q=0.9',
                'Referer': 'https://mobile.capcutshare.com/',
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1',
                'Origin': 'https://mobile.capcutshare.com',
                'Host': 'feed-api.capcutapi.com',
                'pf': '1',
                'app-sdk-version': '100.0.0',
                'sign': '279ff6779bd2bb1684e91d411499ee79',
                'loc': 'BR',
                'sign-ver': '1',
                'device-time': '1699453732',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Site': 'cross-site',
                'Sec-Fetch-Dest': 'empty',
                'Content-Type': 'application/json'
            }
        };       
        const response = await axios.request(options);
        const userData = response.data.data;
        return userData;
    } catch (error) {
        throw new Error("Error occurred:", error);
    }
}

module.exports.spotifydl = async function(url) {
   const res = await axios.get(`https://test-ai-ihc6.onrender.com/mid/spotify-v2?url=${url}`);
   const result = res.data.result.split('\n').map(item => item.split(': ')[1]);
   const [title, artist, album, releaseDate] = result;
   const link = res.data.av;
   const a = {
     title,
     artist,
     album,
     create_at: releaseDate,
     link
   }
  return a;
}

module.exports.threadapi = async (username, type) => {
    try {
        if (type === 'search') {
            const response = await axios.post('https://www.threads.net/api/graphql', {
                lsd: "AVrTctk8rlk",
                variables: JSON.stringify({ 
                    query: username,
                    first: 20,
                    should_fetch_ig_inactive_on_text_app: null,
                    __relay_internal__pv__BarcelonaIsLoggedInrelayprovider: null
                }),
                doc_id: "7156716761073591",
            }, {
                headers: {
                    Authority: "www.threads.net",
                    Accept: "*/*",
                    "Accept-Language": "en-US,en;q=0.9",
                    "Cache-Control": "no-cache",
                    "Content-Type": "application/json",
                    Origin: "https://www.threads.net",
                    Pragma: "no-cache",
                    "Sec-Fetch-Site": "same-origin",
                    "X-ASBD-ID": "129477",
                    "X-IG-App-ID": "238260118697367",
                    "X-FB-LSD": "AVrTctk8rlk",
                    "X-FB-Friendly-Name": "BarcelonaProfileThreadsTabQuery",
                }
            });
            if (!response.data.data.xdt_api__v1__users__search_connection.edges.length) {
                return { msg: 'User not available' };
            }
            const data = response.data.data.xdt_api__v1__users__search_connection.edges.map(ul => ul.node);
            return { data };
        } else {
            const response = await axios.get(`https://www.threads.net/@${username}`, {
                headers: {
                    Authority: "www.threads.net",
                    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
                    "Accept-Language": "en-US,en;q=0.9",
                    "Cache-Control": "no-cache",
                    "Content-Type": "application/json",
                    Origin: "https://www.threads.net",
                    Pragma: "no-cache",
                    Referer: "https://www.instagram.com",
                    "Sec-Fetch-Dest": "document",
                    "Sec-Fetch-Mode": "navigate",
                    "Sec-Fetch-Site": "cross-site",
                    "Sec-Fetch-User": "?1",
                    "Upgrade-Insecure-Requests": "1",
                    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/11.1.2 Safari/605.1.15"
                }
            });
            const userIdKeyValue = response.data.match('"user_id":"(\\d+)"');
            const userId = Number(userIdKeyValue[1]);
            if (!userId) {
                return { msg: 'Can not get user id' };
            }
            const json = await axios.post('https://www.threads.net/api/graphql', {
                lsd: "AVrTctk8rlk",
                variables: JSON.stringify({ userID: userId }),
                doc_id: "6232751443445612",
            }, {
                headers: {
                    Authority: "www.threads.net",
                    Accept: "*/*",
                    "Accept-Language": "en-US,en;q=0.9",
                    "Cache-Control": "no-cache",
                    "Content-Type": "application/json",
                    Origin: "https://www.threads.net",
                    Pragma: "no-cache",
                    "Sec-Fetch-Site": "same-origin",
                    "X-ASBD-ID": "129477",
                    "X-IG-App-ID": "238260118697367",
                    "X-FB-LSD": "AVrTctk8rlk",
                    "X-FB-Friendly-Name": "BarcelonaProfileThreadsTabQuery"
                }
            });
            if (!json.data || !json.data.data || !json.data.data.mediaData || !json.data.data.mediaData.threads.length) {
                return { msg: 'Error: no content post' };
            }
            const data = json.data.data.mediaData.threads.map(v => v.thread_items);
            return { data };
        }
    } catch (e) {
        console.log(e);
        return { msg: e.message };
    }
};

module.exports.threadsdlv2 = async function(url) {
    try {
        const r = await axios.get(url, {
            headers: {
                'authority': 'www.threads.net',
                'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
                'accept-language': 'en-US,en;q=0.9',
                'cache-control': 'no-cache',
                'pragma': 'no-cache',
                'sec-ch-ua': '"Not.A/Brand";v="99", "Chromium";v="99", ";Not.A"Brand";v="99"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"',
                'sec-fetch-dest': 'document',
                'sec-fetch-mode': 'navigate',
                'sec-fetch-site': 'none',
                'sec-fetch-user': '?1',
                'upgrade-insecure-requests': '1',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.0.0 Safari/537.36',
            }
        });
        const $ = cheerio.load(r.data);
        const a = $('script[type="application/json"]').map((i, e) => {
            const c = $(e).html();
            const regex = /"require"\s*:\s*\[\s*\[\s*"ScheduledServerJS",\s*"handle",\s*null,/;
            const m = regex.exec(c);
            return m && m.length > 0 ? JSON.parse(c) : null;
        }).get().filter(Boolean);
        if (a.length === 0) {
            throw new Error('Không tìm thấy dữ liệu!');
        }
        const d = a[3]?.require[0]?.[3]?.[0]?.__bbox?.require[0]?.[3]?.[1]?.__bbox?.result?.data?.data?.edges[0]?.node?.thread_items[0]?.post;
        return d;
    } catch (e) {
        throw new Error(`Request Error: ${e.message}`);
    }
}

module.exports.shoppedl = async function(url) {
    try {
        const res = await axios.get(url);
        const linkOr = decodeURIComponent(res.request.res.responseUrl);
         function removeLink(o) {
           const prefix = 'https://shopee.vn/universal-link?deep_and_web=1&redir=';
         if (o.startsWith(prefix)) {
            return o.substring(prefix.length);
         }
          return o;
        }
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.0.0 Safari/537.36',
            'accept-language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive'
        };
        const response = await axios.get(`${removeLink(linkOr)}`, { headers });
        const $ = cheerio.load(response.data);
        const jsonData = $('script#__NEXT_DATA__').html();
        const parsedData = JSON.parse(jsonData);
        const videoInfo = parsedData.props.pageProps.videoInfo.video;
        const data = {
            title: videoInfo.caption,
            duration: videoInfo.duration,
            likes: parsedData.props.pageProps.videoInfo.count.likeCount,
            comment: parsedData.props.pageProps.videoInfo.count.commentCount,
            author: parsedData.props.pageProps.videoInfo.userInfo.videoUserName,
            url: parsedData.props.pageProps.videoInfo.video.watermarkVideoUrl
        };
        return data;
    } catch (error) {
        throw new Error('Error retrieving video information');
    }
}

module.exports.iginfo = async function(username) {
    try {
        const userAgents =
	[
		"Mozilla/5.0 (Linux; Android 12; F-51B Build/V47RD64B; wv) AppleWebKit/537.36 (KHTML, like Gecko) Ve	Android rsion/4.0 Chrome/108.0.5359.128 Mobile Safari/537.36 Instagram 265.0.0.19.301 Android (31/12; 360dpi; 720x1366; FCNT; F-51B; F51B; qcom; ja_JP; 436384443)",
		"Mozilla/5.0 (Linux; Android 13; Pixel 6a) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.5359.128 Mobile Safari/537.36 Instagram 265.0.0.19.301 Android (31/13; 320dpi; 720x1366; FCNT; F-51B; F51B; qcom; ja_JP; 436384443)",
		"Mozilla/5.0 (Linux; Android 13; Pixel 6a) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.5359.128 Mobile Safari/537.36 Instagram 265.0.0.19.301 Android (31/12; 320dpi; 720x1366; FCNT; F-51B; F51B; qcom; ja_JP; 436384443)",
		"Instagram 264.0.0.22.106 Android (28/9; 160dpi; 800x1232; JOYAR/onn; TBBVNC100005208; TBBVNC100005208; mt8163; en_US; 430370697)	Android	ONN TBBVNC100005208",
		"Mozilla/5.0 (Linux; Android 9; KFONWI Build/PS7326.3183N; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/106.0.5249.170 Safari/537.36 Instagram 253.0.0.23.114 Android (28/9; 213dpi; 800x1216; Amazon; KFONWI; onyx; mt8168; de_DE; 399993134)",
		"Mozilla/5.0 (Linux; Android 9; KFONWI Build/PS7326.3183N; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/106.0.5249.170 Safari/537.36 Instagram 253.0.0.23.114 Android (28/9; 213dpi; 800x1216; Amazon; KFONWI; onyx; mt8168; en_GB; 399993134)9	Explay Onyx",
		"Mozilla/5.0 (Linux; Android 12; F-51B Build/V47RD64B; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/108.0.5359.128 Mobile Safari/537.36 Instagram 265.0.0.19.301 Android (31/12; 320dpi; 720x1366; FCNT; F-51B; F51B; qcom; ja_JP; 436384443)12	Fujitsu Arrows We",
		"Instagram 261.0.0.21.111 Android (30/11; 540dpi; 1080x2137; HMD Global/Nokia; Nokia X100; DM5; qcom; es_US; 418951310)	Android	Nokia Nokia X100",
		"Mozilla/5.0 (Linux; Android 9; KFONWI Build/PS7326.3183N; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/106.0.5249.170 Safari/537.36 Instagram 264.0.0.22.106 Android (28/9; 213dpi; 800x1216; Amazon; KFONWI; onyx; mt8168; de_DE; 430370685)9	Explay Onyx",
		"Mozilla/5.0 (Linux; Android 12; FCG01 Build/V40RK64A; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/108.0.5359.128 Mobile Safari/537.36 Instagram 264.0.0.22.106 Android (31/12; 360dpi; 720x1366; FCNT; FCG01; FCG01; qcom; ja_JP; 430370701)12	Fujitsu Arrows We",
		"Mozilla/5.0 (Linux; Android 9; KFONWI Build/PS7326.3183N; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/106.0.5249.170 Safari/537.36 Instagram 224.2.0.20.116 Android (28/9; 213dpi; 800x1216; Amazon; KFONWI; onyx; mt8168; en_US; 354065894)9	Explay Onyx",
		"Instagram 145.0.0.32.119 Android (29/10; 480dpi; 1080x2264; Realme; RMX1851; RMX1851; qcom; en_US; 219308759)	Android	Realme 3 Pro",
		"Mozilla/5.0 (Linux; Android 9; 7DY Build/PPR1.180610.011; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/108.0.5359.128 Safari/537.36 Instagram 264.0.0.22.106 Android (28/9; 160dpi; 600x976; mediacom; 7DY; 7DY; mt8321; it_IT; 430370684)9	Mediacom 7DY",
		"Mozilla/5.0 (Linux; Android 9; 1CY Build/PPR1.180610.011; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/108.0.5359.128 Safari/537.36 Instagram 264.0.0.22.106 Android (28/9; 160dpi; 800x1232; mediacom; 1CY; 1CY; mt8321; it_IT; 430370684)9	Mediacom 1CY",
		"Mozilla/5.0 (Linux; Android 12; F-51B Build/V47RD64B; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/108.0.5359.128 Mobile Safari/537.36 Instagram 264.0.0.22.106 Android (31/12; 320dpi; 720x1366; FCNT; F-51B; F51B; qcom; ja_JP; 430370627)12	Fujitsu Arrows We",
		"Mozilla/5.0 (Linux; Android 5.1; B1-723 Build/LMY47I; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/95.0.4638.74 Safari/537.36 Instagram 264.0.0.22.106 Android (22/5.1; 160dpi; 600x976; Acer/acer; B1-723; oban; mt6580; it_IT; 430370684)5	Acer Iconia Talk 7",
		"Mozilla/5.0 (Linux; Android 11; FCG01 Build/V14RK61D; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/108.0.5359.128 Mobile Safari/537.36 Instagram 264.0.0.22.106 Android (30/11; 320dpi; 720x1366; FCNT; FCG01; FCG01; qcom; ja_JP; 430370701)11	Fujitsu Arrows We",
		"Mozilla/5.0 (Linux; Android 9; 7DY Build/PPR1.180610.011; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/108.0.5359.128 Safari/537.36 Instagram 263.2.0.19.104 Android (28/9; 160dpi; 600x976; mediacom; 7DY; 7DY; mt8321; it_IT; 428413120)9	Mediacom 7DY",
		"Mozilla/5.0 (Linux; Android 12; F-51B Build/V47RD64B; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/108.0.5359.128 Mobile Safari/537.36 Instagram 264.0.0.22.106 Android (31/12; 320dpi; 720x1366; FCNT; F-51B; F51B; qcom; ja_JP; 430370703)12	Fujitsu Arrows We",
		"Mozilla/5.0 (Linux; Android 9; KFONWI Build/PS7326.3183N; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/106.0.5249.170 Safari/537.36 Instagram 253.0.0.23.114 Android (28/9; 213dpi; 800x1216; Amazon; KFONWI; onyx; mt8168; en_CA; 399993134)"
	];
        const BASE_URL = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`;
        const headers = {
            "user-agent": userAgents[Math.floor(Math.random() * userAgents.length)],
            "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
            "accept-language": "vi,en;q=0.9,en-GB;q=0.8,en-US;q=0.7",
            "cache-control": "max-age=0",
            "sec-ch-prefers-color-scheme": "dark",
            "sec-ch-ua": "\"Not_A Brand\";v=\"99\", \"Microsoft Edge\";v=\"109\", \"Chromium\";v=\"109\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "sec-fetch-dest": "document",
            "sec-fetch-mode": "navigate",
            "sec-fetch-site": "none",
            "sec-fetch-user": "?1",
            "upgrade-insecure-requests": "1",
            "cookie": "csrftoken=MmWyMFr7j6h05DE0ZIhbHVGvmKIBwsn1; mid=Y8jCyAALAAGuxvSb_XxKIqDPDRTA; ig_did=46113657-2712-42E0-AB3A-9FAF79C51B8C; ig_nrcb=1"
        };
        const response = await axios.get(BASE_URL, { headers });
        const { data } = response;
        return data;
    } catch (e) {
        console.log(e);
        throw {
            error: "INVALID_USERNAME",
            message: "Invalid username"
        };
    }
}

module.exports.captrending = async function() {
    const randomPage = Math.floor(Math.random() * 3);
    const options = {
        method: 'GET',
        url: `https://ssscap.net/api/trending?page=${randomPage}`,
        headers: {
            'authority': 'ssscap.net',
            'accept': '*/*',
            'accept-language': 'vi-VN,vi;q=0.9,fr-FR;q=0.8,fr;q=0.7,en-US;q=0.6,en;q=0.5',
            'cookie': '__gads=ID=03431c20aa7b82e4:T=1704100049:RT=1704100049:S=ALNI_MbE1NkGBiFXQe8EUpVgsmCNZ0mJVA; __gpi=UID=00000cce585c8964:T=1704100049:RT=1704100049:S=ALNI_MaI4WwEuvI8Uh3mBXwYyFOBZjj4Fw; FCNEC=%5B%5B%22AKsRol89woXfNWJs4u6AZxkFpWeTzMQkqVPf5E6C6U5UqaW7PtWzZdtx-D5KPNAEKHnbRwJbpcMiOMgfwV6XnBjv-lUHvQTKQpM7Yd_AglzSPP_v7x-EBkqX_7OxnJhCqriVCpfhhe23-KhDiFBVuvx0Jfr8WFxrPg%3D%3D%22%5D%5D; sign=936a82e9336542a58828d17ecd2e897c; device-time=1704100333392',
            'if-none-match': 'W/"113g0xmp3wq4ko"',
            'referer': 'https://ssscap.net/capcut-template',
            'sec-ch-ua': 'Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-origin',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
    };
    try {
        const response = await axios.request(options);
        return response.data.data;
    } catch (error) {
        throw new Error('Failed to fetch trending data from ssscap.net');
    }
}

module.exports.igpostuser = async function(username) {
    try {
        const proxyAgent = new HttpsProxyAgent('http://103.153.254.198:3080');
        const BASE_URL = `https://i.instagram.com/api/v1/users/web_profile_info/?username=${username}`;
        const { data } = await axios({
            url: BASE_URL,
            headers: {
                "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36 Edg/109.0.1518.55",
                "accept": "*/*",
                "accept-language": "vi,en-US;q=0.9,en;q=0.8",
                "sec-ch-ua": "\"Chromium\";v=\"106\", \"Microsoft Edge\";v=\"106\", \"Not;A=Brand\";v=\"99\"",
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": "\"Windows\"",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-site",
                "x-asbd-id": "198387",
                "x-csrftoken": "94HUiQIoRE8XEAkiGN3oEHSVLEDpzlnM",
                "x-ig-app-id": "936619743392459",
                "x-ig-www-claim": "hmac.AR3OQ0qbMQFGvopKt6bvf27cwSi_srYglMRalVX8pFRJNKXt",
                "x-requested-with": "XMLHttpRequest",
                "cookie": "ig_nrcb=1; csrftoken=94HUiQIoRE8XEAkiGN3oEHSVLEDpzlnM; mid=Y8jaNwALAAFAtVwK0OuIkT_IkUvJ; ig_did=AFDB5466-11F2-4B70-8806-94F872304DA0; datr=7trIY6-UmELSkqqrYsxkK5Pg",
                "Referer": "https://www.instagram.com/",
                "Referrer-Policy": "strict-origin-when-cross-origin",
            },
            httpsAgent: https.Agent({ keepAlive: true }),
            method: "GET"
        });
        const user = data.data.user;
        return {
            edge_owner_to_timeline_media: user.edge_owner_to_timeline_media,
            edge_felix_video_timeline: user.edge_felix_video_timeline
        };
    } catch (e) {
        console.log(e);
        throw e.response.data;
    }
}

module.exports.sclsearch = async function(query) {
  const headers = {
    Accept: "application/json",
    "Accept-Language": "en-US,en;q=0.9,vi;q=0.8",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.5005.63 Safari/537.36",
  };

  const url = `https://soundcloud.com`;

  try {
    const response = await axios.get(`https://m.soundcloud.com/search?q=${encodeURIComponent(query)}`, { headers });
    const htmlContent = response.data;
    const $ = cheerio.load(htmlContent);
    const data = [];

    $("div > ul > li > div").each(function (index, element) {
      if (index < 8) {
        const title = $(element).find("a").attr("aria-label")?.trim() || "";
        const trackURL = url + ($(element).find("a").attr("href") || "").trim();
        const thumb = $(element).find("a > div > div > div > picture > img").attr("src")?.trim() || "";
        const artist = $(element).find("a > div > div > div").eq(1).text()?.trim() || "";
        const views = $(element).find("a > div > div > div > div > div").eq(0).text()?.trim() || "";
        const timestamp = $(element).find("a > div > div > div > div > div").eq(1).text()?.trim() || "";
        const release = $(element).find("a > div > div > div > div > div").eq(2).text()?.trim() || "";

        data.push({
          title,
          trackURL,
          thumb,
          artist,
          views,
          release,
          timestamp,
        });
      }
    });
    return data;
  } catch (error) {
    console.error("Error fetching data from SoundCloud:", error);
    return [];
  }
}

module.exports.youtubedl = async function(url) {
  function formatSeconds(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    const pad = (num) => String(num).padStart(2, "0");
    return `${pad(hours)}:${pad(minutes)}:${pad(secs)}`;
  }
  function getRandomUserAgent() {
    const browsers = ["Chrome", "Firefox", "Safari", "Edge", "Opera"];
    const osList = [
      "Windows NT 10.0; Win64; x64",
      "Macintosh; Intel Mac OS X 10_15_7",
      "X11; Linux x86_64",
    ];
    const webKitVersion = `537.${Math.floor(Math.random() * 100)}`;
    const browserVersion = `${Math.floor(Math.random() * 100)}.0.${Math.floor(Math.random() * 10000)}.${Math.floor(Math.random() * 100)}`;
    const browser = browsers[Math.floor(Math.random() * browsers.length)];
    const os = osList[Math.floor(Math.random() * osList.length)];
    return `Mozilla/5.0 (${os}) AppleWebKit/${webKitVersion} (KHTML, like Gecko) ${browser}/${browserVersion} Safari/${webKitVersion}`;
  }
  function getRandomValue() {
    return Math.floor(Math.random() * 10000000000);
  }
  function getRandomCookie() {
    const ga = `_ga=GA1.1.${getRandomValue()}.${getRandomValue()}`;
    const gaPSRPB96YVC = `_ga_PSRPB96YVC=GS1.1.${getRandomValue()}.2.1.${getRandomValue()}.0.0.0`;
    return `${ga}; ${gaPSRPB96YVC}`;
  }
  const userAgent = getRandomUserAgent();
  const cookies = getRandomCookie();
  async function getData(url) {
    try {
      const { data } = await axios.post(
        "https://www.y2mate.com/mates/vi854/analyzeV2/ajax",
        qs.stringify({
          k_query: url,
          k_page: "Youtube Downloader",
          hl: "vi",
          q_auto: 0,
        }),
        {
          headers: {
            Accept: "*/*",
            "Accept-Encoding": "gzip, deflate, br, zstd",
            "Accept-Language": "vi,en;q=0.9",
            "Content-Length": "104",
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            Cookie: cookies,
            Origin: "https://www.y2mate.com",
            Priority: "u=1, i",
            Referer: "https://www.y2mate.com/vi854/download-youtube",
            "Sec-Ch-Ua":
              '"Google Chrome";v="125", "Chromium";v="125", "Not.A/Brand";v="24"',
            "Sec-Ch-Ua-Mobile": "?0",
            "Sec-Ch-Ua-Platform": '"Windows"',
            "Sec-Fetch-Dest": "empty",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "same-origin",
            "User-Agent": userAgent,
            "X-Requested-With": "XMLHttpRequest",
          },
        },
      );
      return {
        id: data.vid,
        title: data.title,
        duration: data.t,
        author: data.a,
        k: data.links.mp4["18"]["k"],
      };
    } catch (error) {
      console.error("Error posting data:", error);
    }
  }
  let dataPost = await getData(url);
  try {
    const response = await axios.post(
      "https://www.y2mate.com/mates/convertV2/index",
      qs.stringify({
        vid: dataPost.id,
        k: dataPost.k,
      }),
      {
        headers: {
          Accept: "*/*",
          "Accept-Encoding": "gzip, deflate, br, zstd",
          "Accept-Language": "vi,en;q=0.9",
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          Cookie: cookies,
          Origin: "https://www.y2mate.com",
          Priority: "u=1, i",
          Referer: "https://www.y2mate.com/vi/",
          "Sec-Ch-Ua": '"Google Chrome";v="125", "Chromium";v="125", "Not.A/Brand";v="24"',
          "Sec-Ch-Ua-Mobile": "?0",
          "Sec-Ch-Ua-Platform": '"Windows"',
          "Sec-Fetch-Dest": "empty",
          "Sec-Fetch-Mode": "cors",
          "Sec-Fetch-Site": "same-origin",
          "User-Agent": userAgent,
          "X-Requested-With": "XMLHttpRequest",
        },
      },
    );
    return {
      id: dataPost.id,
      title: dataPost.title,
      duration: formatSeconds(dataPost.duration),
      author: dataPost.author,
      url: response.data.dlink,
    };
  } catch (error) {
    console.error("Error:", error);
  }
}


module.exports.photooxy = async function(url, text) {
  async function getBuffer(url, options){
	try {
		options ? options : {}
		const res = await axios({
			method: "get",
			url,
			headers: {
				'DNT': 1,
				'Upgrade-Insecure-Request': 1
			},
			...options,
			responseType: 'arraybuffer'
		})
		return res.data
	} catch (err) {
		return err
	}
}
async function post(url, formdata = {}, cookies) {
  let encode = encodeURIComponent;
  let body = Object.keys(formdata)
    .map((key) => {
      let vals = formdata[key];
      let isArray = Array.isArray(vals);
      let keys = encode(key + (isArray ? "[]" : ""));
      if (!isArray) vals = [vals];
      let out = [];
      for (let valq of vals) out.push(keys + "=" + encode(valq));
      return out.join("&");
    })
    .join("&");
  return await fetch(`${url}?${body}`, {
    method: "GET",
    headers: {
      Accept: "*/*",
      "Accept-Language": "en-US,en;q=0.9",
      "User-Agent": "GoogleBot",
      Cookie: cookies,
    },
  });
}
  const geturl = await fetch(url, {
    method: "GET",
    headers: {
      "User-Agent": "GoogleBot",
    },
  });
  const caritoken = await geturl.text();
  let hasilcookie = geturl.headers
    .get("set-cookie")
    .split(",")
    .map((v) => cookie.parse(v))
    .reduce((a, c) => {
      return { ...a, ...c };
    }, {});
  hasilcookie = {
    __cfduid: hasilcookie.__cfduid,
    PHPSESSID: hasilcookie.PHPSESSID,
  };
  hasilcookie = Object.entries(hasilcookie)
    .map(([name, value]) => cookie.serialize(name, value))
    .join("; ");
  const $ = cheerio.load(caritoken);
  const token = $('input[name="token"]').attr("value");
  const form = new FormData();
  if (typeof text === "string") text = [text];
  for (let texts of text) form.append("text[]", texts);
  form.append("submit", "Go");
  form.append("token", token);
  form.append("build_server", "https://e2.yotools.net");
  form.append("build_server_id", 2);
  const geturl2 = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "*/*",
      "Accept-Language": "en-US,en;q=0.9",
      "User-Agent": "GoogleBot",
      Cookie: hasilcookie,
      ...form.getHeaders(),
    },
    body: form.getBuffer(),
  });
  const caritoken2 = await geturl2.text()
  const $$ = cheerio.load(caritoken2)
  const token2 = $$("#form_value").text()
  if (!token2) throw new Error("Token Tidak Ditemukan!!");
  const prosesimage = await post(
    "https://photooxy.com/effect/create-image",
    JSON.parse(token2),
    hasilcookie
  );
  const hasil = await prosesimage.json();
  const hassil = `https://e2.yotools.net/${hasil.image}`
  const result = await getBuffer(hassil)
  return result
}

module.exports.igstory = async (url) => {
    try {
        if (!url.match(/(?:https?:\/\/(web\.|www\.|m\.)?(facebook|fb)\.(com|watch)\S+)?$/) && !url.match(/(https|http):\/\/www.instagram.com\/(p|reel|tv|stories)/gi)) return { msg: `Link Url not valid` };

        function decodeSnapApp(args) {
            let [h, u, n, t, e, r] = args;

            function decode(d, e, f) {
                const g = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+/'.split('');
                let h = g.slice(0, e);
                let i = g.slice(0, f);
                let j = d.split('').reverse().reduce(function(a, b, c) {
                    if (h.indexOf(b) !== -1)
                        return a += h.indexOf(b) * (Math.pow(e, c));
                }, 0);
                let k = '';
                while (j > 0) {
                    k = i[j % f] + k;
                    j = (j - (j % f)) / f;
                }
                return k || '0';
            }
            r = '';
            for (let i = 0, len = h.length; i < len; i++) {
                let s = "";
                while (h[i] !== n[e]) {
                    s += h[i];
                    i++;
                }
                for (let j = 0; j < n.length; j++)
                    s = s.replace(new RegExp(n[j], "g"), j.toString());
                r += String.fromCharCode(decode(s, e, 10) - t);
            }
            return decodeURIComponent(encodeURIComponent(r));
        }

        function getEncodedSnapApp(data) {
            return data.split('decodeURIComponent(escape(r))}(')[1]
                .split('))')[0]
                .split(',')
                .map(v => v.replace(/"/g, '').trim());
        }

        function getDecodedSnapSave(data) {
            return data.split('getElementById("download-section").innerHTML = "')[1]
                .split('"; document.getElementById("inputData").remove(); ')[0]
                .replace(/\\(\\)?/g, '');
        }

        function decryptSnapSave(data) {
            return getDecodedSnapSave(decodeSnapApp(getEncodedSnapApp(data)));
        }

        const response = await new Promise((resolve, reject) => {
            request.post({
                url: 'https://snapsave.app/action.php?lang=id',
                headers: {
                    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
                    'content-type': 'application/x-www-form-urlencoded',
                    'origin': 'https://snapsave.app',
                    'referer': 'https://snapsave.app/id',
                    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36'
                },
                form: { url }
            }, (error, response, body) => {
                if (error) reject(error);
                else resolve(body);
            });
        });

        const decode = decryptSnapSave(response);
        const $ = cheerio.load(decode);
        const results = [];

        if ($('table.table').length || $('article.media > figure').length) {
            const thumbnail = $('article.media > figure').find('img').attr('src');
            $('tbody > tr').each((_, el) => {
                const $el = $(el);
                const $td = $el.find('td');
                const resolution = $td.eq(0).text();
                let _url = $td.eq(2).find('a').attr('href') || $td.eq(2).find('button').attr('onclick');
                const shouldRender = /get_progressApi/ig.test(_url || '');
                if (shouldRender) {
                    const match = /get_progressApi\('(.*?)'\)/.exec(_url || '');
                    _url = match ? match[1] || _url : _url;
                }

                results.push({
                    resolution,
                    thumbnail,
                    url: _url,
                    shouldRender
                });
            });
        } else {
            $('div.download-items__thumb').each((_, tod) => {
                const thumbnail = $(tod).find('img').attr('src');
                $('div.download-items__btn').each((_, ol) => {
                    let _url = $(ol).find('a').attr('href');
                    if (!/https?:\/\//.test(_url || '')) _url = `https://snapsave.app${_url}`;
                    results.push({
                        thumbnail,
                        url: _url
                    });
                });
            });
        }

        if (!results.length) return { msg: `Blank data` };
        return results;
    } catch (e) {
        return { msg: e.message };
    }
};

module.exports.igstoryv2 = async (url) => {
    try {
        const response = await axios.post("https://saveig.app/api/ajaxSearch", require('querystring').stringify({ q: url, t: "media", lang: "en" }), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'Accept-Encoding': 'gzip, deflate, br',
                'Origin': 'https://saveig.app/en',
                'Referer': 'https://saveig.app/en',
                'Referrer-Policy': 'strict-origin-when-cross-origin',
                'User-Agent': 'PostmanRuntime/7.31.1'
            }
        });

        const json = response.data;
        const $ = cheerio.load(json.data);
        const data = [];

        $('div[class="download-items__btn"]').each(async (i, e) => {
            const type = $(e).find('a').attr('href').match('.jpg') ? 'image' : 'video';
            const url = $(e).find('a').attr('href');
            data.push({ type, url });
        });
        if (!data.length) return { status: false };       
        return data;
    } catch (e) {
        console.log(e);
        return { msg: e.message };
    }
};

module.exports.zmp3dl = async function(id) {
    try {
        const response = await axios.get('http://api.mp3.zing.vn/api/streaming/audio/' + id + '/128', {
            responseType: 'stream'
        });
        if (response.data.readableLength == 0)
            throw new Error('Không thể tải xuống bài hát này');
        return response.data;
    }
    catch (error) {
        throw new Error('Không thể tải xuống bài hát này');
    }
}

module.exports.spdltrack = async function(url) {
    try {
        const isValidUrl = (str) => /^https?:\/\//.test(str) && /open\.spotify\.com/i.test(str);
        const getSpotifyTrackId = (url) => {
            const regex = /\/track\/(\w+)/;
            const match = url.match(regex);
            return match ? match[1] : null;
        };
        if (!isValidUrl(url)) {
            throw new Error("Invalid URL: " + url);
        }
        const trackId = getSpotifyTrackId(url);
        const response = await axios.get("https://spotidown.com/wp-json/spotify-downloader/v1/download", {
            params: {
                api_request_path: "tracks/",
                item_id: trackId,
            },
            headers: {
                Accept: "application/json, text/javascript, */*; q=0.01",
                "X-Requested-With": "XMLHttpRequest",
                "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Mobile Safari/537.36",
                Referer: "https://spotidown.com/",
            },
        });
        return response.data;
    } catch (error) {
        return { msg: error.message || error };
    }
}

module.exports.tiktokinfo = async function(username) {
    if (!username) {
        throw new Error('Vui lòng cung cấp username');
    }
    const maxRetries = 3;
    const timeout = 10000;
    for (let retryCount = 0; retryCount < maxRetries; retryCount++) {
        try {
            const response = await axios.get(`https://tiktok.com/@${username}`, { timeout });
            const $ = cheerio.load(response.data);
            const userData = JSON.parse($('#__UNIVERSAL_DATA_FOR_REHYDRATION__').text()).__DEFAULT_SCOPE__['webapp.user-detail'].userInfo;
            const userInfo = {
                ...userData.user,
                ...userData.stats
            };
            return userInfo;
        } catch (err) {
            if (err.response && err.response.status === 404) {
                throw new Error('Không tìm thấy người dùng');
            } else {
                console.error(`Lỗi khi lấy dữ liệu cho ${username}: ${err.message}`);
                if (retryCount === maxRetries - 1) {
                    throw new Error(`Không thể lấy dữ liệu cho ${username}`);
                }
            }
        }
    }
}

module.exports.tiktoksearch = async function(keywords, limit = 10) {
  try {
    const response = await axios.get(`https://m.tiktok.com/api/search/general/full/?keyword=${encodeURI(keywords)}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:99.0) Gecko/20100101 Firefox/99.0",
        "cookie": "_ttp=2UYKQrM4SmZZenItvveYVoKcRbi; tt_chain_token=xJitPcTGnRtRoIQbkG1Rpg==; tiktok_webapp_theme=light; uid_tt=718bd1d8fc4d8a6eaf7fe1bd59d2fedb46158b25e382d5e9c0277697edac7c23; uid_tt_ss=718bd1d8fc4d8a6eaf7fe1bd59d2fedb46158b25e382d5e9c0277697edac7c23; sid_tt=5c175b76c99f4e3b07ab3ca7c0c1e151; sessionid=5c175b76c99f4e3b07ab3ca7c0c1e151; sessionid_ss=5c175b76c99f4e3b07ab3ca7c0c1e151; store-idc=alisg; store-country-code=vn; store-country-code-src=uid; tt-target-idc=alisg; tt-target-idc-sign=IZqkoGplb7W_eUgHBchKFio2X3juz96L66dacqHNIFz54B9LeKsejGtoGBSO6USJ8EByFEkqwevpeEZH0fqHZa99vQaFtdbVk8gkBN8dM0yJIWObx4NM2v5Cser9N5bP1ZLKMBFnVLUVPaeVO1cxRJsq3b4UGBPJg0AKWufql0hV6YztnBXYDZ7GcFxpS9JfmnRxkQL2DcyQaIz0jIYgZEvzrOuOzYhf0-7M0AOhhj5URcnGOt7m8T0BQLqIcXaT80jNjk1RoRQ_2l8Nm_l0N_V1428nyjt37mu83zFDdYsx5Kt0n77JbpNbfWhHxY6pFSVt-Dcn5ElzRfLPwrp8Fj7PQsuWd3rtSXv-VR4Gd5g2zOiu5i9xJwOXLoWaEnuT_i9jsA5PkZ1bdt561DpoWBnJyPqz9gl2VBmcmIq0OeefZIVnxUvVVaP5TlUvrbTB6xLHJ37hrNd1vh8I63Ux7EwTIplI5zyA2seFtUcq8OF5EiebFe6wlmy7qQd2_sVr; tt_csrf_token=DFfQHzT9-qG_2NUUsBZ5gtUV7aBvzodS9Ydc; ak_bmsc=9CDD4A265744E29B6FA10260420F838F~000000000000000000000000000000~YAAQF+ercU09wuCOAQAAbo2pRxd2vCSmrBA1B3BNtavmHKdqChmVpaxVoLvENxwnjbbBYp1e4lkavk1Rf7Jojl9SsYCS3mnTthMDsQKZQAyRz++JjSMMeHAd1M8j0443AMfQA5sICVZQ82VA4xmxvN1B3y0ZbKWcV1g/AkqBHHsryFt+JUJSHtJOYLcjp2Ric81qBS9e1YwUF3ux1aUNXkre6+DlysonlwvOQrgtscMz4tLI2ncqNq5AKPIGMOGbSinSMACkeyGedU15oYm9jM78KEZvctPfVqb/gmWQJBnbShm/BSvI2QalR2N4FOkbeg5FynyD5XYxbOY38rZMDl5Dmt3Jll/0ZLayQdqwsmFa8+G3FcnnOiP1pty2B6L261+1O90zN1mI; sid_guard=5c175b76c99f4e3b07ab3ca7c0c1e151%7C1714894249%7C15552000%7CFri%2C+01-Nov-2024+07%3A30%3A49+GMT; sid_ucp_v1=1.0.0-KDBjNTY5OTcxZTJmZWVmYjUzY2E5MzlmZjc3NjE1ZTg5YTQ1MTM2ZDEKHwiBiLaC6qSB32UQqevcsQYYswsgDDDcjfitBjgIQBIQAxoDc2cxIiA1YzE3NWI3NmM5OWY0ZTNiMDdhYjNjYTdjMGMxZTE1MQ; ssid_ucp_v1=1.0.0-KDBjNTY5OTcxZTJmZWVmYjUzY2E5MzlmZjc3NjE1ZTg5YTQ1MTM2ZDEKHwiBiLaC6qSB32UQqevcsQYYswsgDDDcjfitBjgIQBIQAxoDc2cxIiA1YzE3NWI3NmM5OWY0ZTNiMDdhYjNjYTdjMGMxZTE1MQ; bm_sv=D79A28FB79A2AA2D4375DD11DD4C18D1~YAAQF+ercVc9wuCOAQAAa6epRxeAqWI6x+0yefULIDep3YqsjNwgfBm2kWiNqwij6CQ5KQm7TDvDUK9/SpQc24JkqUO/0YFeMTd/wcfNrTVDVHOXPUZAVG85ZNcb/3OEYkrZ3Kq1dC0Q3mzSl4SAhYSHayS9ST01XN9WPmYYLlV75VOjnmFTUOLXy21blJ9joWJJ7itmCwegH/k/akeSferkLz7/VP1IQzB6lekufKy1dJYLnmmIARnF/g6HSTs+~1; ttwid=1%7C67Ck6lGLYwQNpr4_BgqfE_qwgXKSWvwhSGTP9p93qTI%7C1714894254%7C63ebeeeb770ac8e61e9daedfde5fcc6382d36b346acf65716f81e8b0b724918d; odin_tt=f2f120d733694b449f2a768f887bba1b92d0bb81b7c6bda293bfa5b76ac470c5a292c50e6fb2fdedf1ea303fae9285c4bda91c95c028b42159712ca8eebbcead6a0d50805b5897ee2b1bc01bf68ed67c; perf_feed_cache={%22expireTimestamp%22:1715065200000%2C%22itemIds%22:[%227363561802946514177%22%2C%227335701134037830944%22]}; msToken=wa0a75jJLYjR8eO8Lss9t-xUeKu5X5ahcqxparKNrQ0kng22XiqVAXzvYPpdcnErVQjXglCNtlGObqExtO_GeWV3fGSPJvDGM60GggT2RdhbhNXPRqyQKFgW1PVZ4KbIRXCLsw==; msToken=8qaceELHDaBpHf50xECAaCnmT8ajkcXCHLPYI9Rj9tHM2uTj1b3sjEsP1W_ByS-AOQDPD0gwCELp6vPonrmgsUg6Gb5PGbWU_xbUd428yGlidDHpV7Vm8eMynrRDJf9HQXAquw==; useragent=TW96aWxsYS81LjAgKExpbnV4OyBBbmRyb2lkIDEwOyBLKSBBcHBsZVdlYktpdC81MzcuMzYgKEtIVE1MLCBsaWtlIEdlY2tvKSBDaHJvbWUvMTIwLjAuMC4wIE1vYmlsZSBTYWZhcmkvNTM3LjM2; _uafec=Mozilla%2F5.0%20(Linux%3B%20Android%2010%3B%20K)%20AppleWebKit%2F537.36%20(KHTML%2C%20like%20Gecko)%20Chrome%2F120.0.0.0%20Mobile%20Safari%2F537.36;",
        "Accept-Language": "vi-VN,vi;q=0.9"
      }
    });
    const getData = response.data.data;
    const result = getData.filter(data => data.type === 1).slice(0, limit).map(data => ({
      id: data.item.id,
      desc: data.item.desc,
      createTime: data.item.createTime,
      stats: data.item.stats,
      video: data.item.video,
      author: data.item.author,
      music: data.item.music,
      challenges: data.item.challenges
    }));
    return result;
  } catch (error) {
    console.error("Error while fetching data:", error);
    return [];
  }
};

module.exports.tiktokdl = async function(url) {
  try {
    function convertDMY(timestamp) {
       const date = new Date(timestamp * 1000);
       return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')} - ${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
    }
    const aweme_id = await global.tools.tiktokID(url);
    const response = await axios.get(`https://api-m.tiktok.com/aweme/v1/feed/?aweme_id=${aweme_id}&iid=7318518857994389254&device_id=7318517321748022790&channel=googleplay&app_name=musical_ly&version_code=300904&device_platform=android&device_type=ASUS_Z01QD&version=9`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:99.0) Gecko/20100101 Firefox/99.0",
        "cookie": "_ttp=2UYKQrM4SmZZenItvveYVoKcRbi; tt_chain_token=xJitPcTGnRtRoIQbkG1Rpg==; tiktok_webapp_theme=light; uid_tt=718bd1d8fc4d8a6eaf7fe1bd59d2fedb46158b25e382d5e9c0277697edac7c23; uid_tt_ss=718bd1d8fc4d8a6eaf7fe1bd59d2fedb46158b25e382d5e9c0277697edac7c23; sid_tt=5c175b76c99f4e3b07ab3ca7c0c1e151; sessionid=5c175b76c99f4e3b07ab3ca7c0c1e151; sessionid_ss=5c175b76c99f4e3b07ab3ca7c0c1e151; store-idc=alisg; store-country-code=vn; store-country-code-src=uid; tt-target-idc=alisg; tt-target-idc-sign=IZqkoGplb7W_eUgHBchKFio2X3juz96L66dacqHNIFz54B9LeKsejGtoGBSO6USJ8EByFEkqwevpeEZH0fqHZa99vQaFtdbVk8gkBN8dM0yJIWObx4NM2v5Cser9N5bP1ZLKMBFnVLUVPaeVO1cxRJsq3b4UGBPJg0AKWufql0hV6YztnBXYDZ7GcFxpS9JfmnRxkQL2DcyQaIz0jIYgZEvzrOuOzYhf0-7M0AOhhj5URcnGOt7m8T0BQLqIcXaT80jNjk1RoRQ_2l8Nm_l0N_V1428nyjt37mu83zFDdYsx5Kt0n77JbpNbfWhHxY6pFSVt-Dcn5ElzRfLPwrp8Fj7PQsuWd3rtSXv-VR4Gd5g2zOiu5i9xJwOXLoWaEnuT_i9jsA5PkZ1bdt561DpoWBnJyPqz9gl2VBmcmIq0OeefZIVnxUvVVaP5TlUvrbTB6xLHJ37hrNd1vh8I63Ux7EwTIplI5zyA2seFtUcq8OF5EiebFe6wlmy7qQd2_sVr; tt_csrf_token=DFfQHzT9-qG_2NUUsBZ5gtUV7aBvzodS9Ydc; ak_bmsc=9CDD4A265744E29B6FA10260420F838F~000000000000000000000000000000~YAAQF+ercU09wuCOAQAAbo2pRxd2vCSmrBA1B3BNtavmHKdqChmVpaxVoLvENxwnjbbBYp1e4lkavk1Rf7Jojl9SsYCS3mnTthMDsQKZQAyRz++JjSMMeHAd1M8j0443AMfQA5sICVZQ82VA4xmxvN1B3y0ZbKWcV1g/AkqBHHsryFt+JUJSHtJOYLcjp2Ric81qBS9e1YwUF3ux1aUNXkre6+DlysonlwvOQrgtscMz4tLI2ncqNq5AKPIGMOGbSinSMACkeyGedU15oYm9jM78KEZvctPfVqb/gmWQJBnbShm/BSvI2QalR2N4FOkbeg5FynyD5XYxbOY38rZMDl5Dmt3Jll/0ZLayQdqwsmFa8+G3FcnnOiP1pty2B6L261+1O90zN1mI; sid_guard=5c175b76c99f4e3b07ab3ca7c0c1e151%7C1714894249%7C15552000%7CFri%2C+01-Nov-2024+07%3A30%3A49+GMT; sid_ucp_v1=1.0.0-KDBjNTY5OTcxZTJmZWVmYjUzY2E5MzlmZjc3NjE1ZTg5YTQ1MTM2ZDEKHwiBiLaC6qSB32UQqevcsQYYswsgDDDcjfitBjgIQBIQAxoDc2cxIiA1YzE3NWI3NmM5OWY0ZTNiMDdhYjNjYTdjMGMxZTE1MQ; ssid_ucp_v1=1.0.0-KDBjNTY5OTcxZTJmZWVmYjUzY2E5MzlmZjc3NjE1ZTg5YTQ1MTM2ZDEKHwiBiLaC6qSB32UQqevcsQYYswsgDDDcjfitBjgIQBIQAxoDc2cxIiA1YzE3NWI3NmM5OWY0ZTNiMDdhYjNjYTdjMGMxZTE1MQ; bm_sv=D79A28FB79A2AA2D4375DD11DD4C18D1~YAAQF+ercVc9wuCOAQAAa6epRxeAqWI6x+0yefULIDep3YqsjNwgfBm2kWiNqwij6CQ5KQm7TDvDUK9/SpQc24JkqUO/0YFeMTd/wcfNrTVDVHOXPUZAVG85ZNcb/3OEYkrZ3Kq1dC0Q3mzSl4SAhYSHayS9ST01XN9WPmYYLlV75VOjnmFTUOLXy21blJ9joWJJ7itmCwegH/k/akeSferkLz7/VP1IQzB6lekufKy1dJYLnmmIARnF/g6HSTs+~1; ttwid=1%7C67Ck6lGLYwQNpr4_BgqfE_qwgXKSWvwhSGTP9p93qTI%7C1714894254%7C63ebeeeb770ac8e61e9daedfde5fcc6382d36b346acf65716f81e8b0b724918d; odin_tt=f2f120d733694b449f2a768f887bba1b92d0bb81b7c6bda293bfa5b76ac470c5a292c50e6fb2fdedf1ea303fae9285c4bda91c95c028b42159712ca8eebbcead6a0d50805b5897ee2b1bc01bf68ed67c; perf_feed_cache={%22expireTimestamp%22:1715065200000%2C%22itemIds%22:[%227363561802946514177%22%2C%227335701134037830944%22]}; msToken=wa0a75jJLYjR8eO8Lss9t-xUeKu5X5ahcqxparKNrQ0kng22XiqVAXzvYPpdcnErVQjXglCNtlGObqExtO_GeWV3fGSPJvDGM60GggT2RdhbhNXPRqyQKFgW1PVZ4KbIRXCLsw==; msToken=8qaceELHDaBpHf50xECAaCnmT8ajkcXCHLPYI9Rj9tHM2uTj1b3sjEsP1W_ByS-AOQDPD0gwCELp6vPonrmgsUg6Gb5PGbWU_xbUd428yGlidDHpV7Vm8eMynrRDJf9HQXAquw==; useragent=TW96aWxsYS81LjAgKExpbnV4OyBBbmRyb2lkIDEwOyBLKSBBcHBsZVdlYktpdC81MzcuMzYgKEtIVE1MLCBsaWtlIEdlY2tvKSBDaHJvbWUvMTIwLjAuMC4wIE1vYmlsZSBTYWZhcmkvNTM3LjM2; _uafec=Mozilla%2F5.0%20(Linux%3B%20Android%2010%3B%20K)%20AppleWebKit%2F537.36%20(KHTML%2C%20like%20Gecko)%20Chrome%2F120.0.0.0%20Mobile%20Safari%2F537.36;",
        "Accept-Language": "vi-VN,vi;q=0.9"
      }
    });
    const awemeList = response.data?.aweme_list;
    if (!awemeList || awemeList.length === 0) {
      return { status: "error", message: "No videos found." };
    }
    
    if (aweme_id !== awemeList[0].aweme_id) {
      return { status: "error", message: "Invalid aweme_id." };
    }

    const firstVideo = awemeList[0];
    const music = {
      type: "Audio",
      title: firstVideo.music.title,
      duration: firstVideo.music.duration,
      url: firstVideo.music.play_url.url_list[0]
    };
    let result;
    if (firstVideo.image_post_info) {
      result = {
        type: "Photo",
        id: firstVideo.aweme_id,
        title: firstVideo.desc,
        nickname: firstVideo.author.nickname,
        unique_id: firstVideo.author.unique_id,
        create_at: convertDMY(firstVideo.create_time),
        commentCount: firstVideo.statistics.comment_count,
        likeCount: firstVideo.statistics.digg_count,
        downloadCount: firstVideo.statistics.download_count,
        playCount: firstVideo.statistics.play_count,
        shareCount: firstVideo.statistics.share_count,
        collectCount: firstVideo.statistics.collect_count,
        url: firstVideo.image_post_info.images.map((v) => v.display_image.url_list[0]),
        music
      };
    } else {
      result = {
        type: "Video",
        id: firstVideo.aweme_id,
        title: firstVideo.desc,
        nickname: firstVideo.author.nickname,
        unique_id: firstVideo.author.unique_id,
        create_at: convertDMY(firstVideo.create_time),
        commentCount: firstVideo.statistics.comment_count,
        likeCount: firstVideo.statistics.digg_count,
        downloadCount: firstVideo.statistics.download_count,
        playCount: firstVideo.statistics.play_count,
        shareCount: firstVideo.statistics.share_count,
        collectCount: firstVideo.statistics.collect_count,
        play: firstVideo.video.play_addr.url_list[0],
        wm: firstVideo.video.download_addr.url_list[0],
        music
      };
    }
    return result;
  } catch (error) {
    return {message: error.message };
  }
}

module.exports.tiktokdlv2 = async function(aweme_id) {
  try {
    function convertDMY(timestamp) {
       const date = new Date(timestamp * 1000);
       return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')} - ${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
    }
    const response = await axios.get(`https://api.tiktokv.com/aweme/v1/feed/?aweme_id=${aweme_id}&iid=7318518857994389254&device_id=7318517321748022790&channel=googleplay&app_name=musical_ly&version_code=300904&device_platform=android&device_type=ASUS_Z01QD&version=9`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:99.0) Gecko/20100101 Firefox/99.0",
        "cookie": "_ttp=2UYKQrM4SmZZenItvveYVoKcRbi; tt_chain_token=xJitPcTGnRtRoIQbkG1Rpg==; tiktok_webapp_theme=light; uid_tt=718bd1d8fc4d8a6eaf7fe1bd59d2fedb46158b25e382d5e9c0277697edac7c23; uid_tt_ss=718bd1d8fc4d8a6eaf7fe1bd59d2fedb46158b25e382d5e9c0277697edac7c23; sid_tt=5c175b76c99f4e3b07ab3ca7c0c1e151; sessionid=5c175b76c99f4e3b07ab3ca7c0c1e151; sessionid_ss=5c175b76c99f4e3b07ab3ca7c0c1e151; store-idc=alisg; store-country-code=vn; store-country-code-src=uid; tt-target-idc=alisg; tt-target-idc-sign=IZqkoGplb7W_eUgHBchKFio2X3juz96L66dacqHNIFz54B9LeKsejGtoGBSO6USJ8EByFEkqwevpeEZH0fqHZa99vQaFtdbVk8gkBN8dM0yJIWObx4NM2v5Cser9N5bP1ZLKMBFnVLUVPaeVO1cxRJsq3b4UGBPJg0AKWufql0hV6YztnBXYDZ7GcFxpS9JfmnRxkQL2DcyQaIz0jIYgZEvzrOuOzYhf0-7M0AOhhj5URcnGOt7m8T0BQLqIcXaT80jNjk1RoRQ_2l8Nm_l0N_V1428nyjt37mu83zFDdYsx5Kt0n77JbpNbfWhHxY6pFSVt-Dcn5ElzRfLPwrp8Fj7PQsuWd3rtSXv-VR4Gd5g2zOiu5i9xJwOXLoWaEnuT_i9jsA5PkZ1bdt561DpoWBnJyPqz9gl2VBmcmIq0OeefZIVnxUvVVaP5TlUvrbTB6xLHJ37hrNd1vh8I63Ux7EwTIplI5zyA2seFtUcq8OF5EiebFe6wlmy7qQd2_sVr; tt_csrf_token=DFfQHzT9-qG_2NUUsBZ5gtUV7aBvzodS9Ydc; ak_bmsc=9CDD4A265744E29B6FA10260420F838F~000000000000000000000000000000~YAAQF+ercU09wuCOAQAAbo2pRxd2vCSmrBA1B3BNtavmHKdqChmVpaxVoLvENxwnjbbBYp1e4lkavk1Rf7Jojl9SsYCS3mnTthMDsQKZQAyRz++JjSMMeHAd1M8j0443AMfQA5sICVZQ82VA4xmxvN1B3y0ZbKWcV1g/AkqBHHsryFt+JUJSHtJOYLcjp2Ric81qBS9e1YwUF3ux1aUNXkre6+DlysonlwvOQrgtscMz4tLI2ncqNq5AKPIGMOGbSinSMACkeyGedU15oYm9jM78KEZvctPfVqb/gmWQJBnbShm/BSvI2QalR2N4FOkbeg5FynyD5XYxbOY38rZMDl5Dmt3Jll/0ZLayQdqwsmFa8+G3FcnnOiP1pty2B6L261+1O90zN1mI; sid_guard=5c175b76c99f4e3b07ab3ca7c0c1e151%7C1714894249%7C15552000%7CFri%2C+01-Nov-2024+07%3A30%3A49+GMT; sid_ucp_v1=1.0.0-KDBjNTY5OTcxZTJmZWVmYjUzY2E5MzlmZjc3NjE1ZTg5YTQ1MTM2ZDEKHwiBiLaC6qSB32UQqevcsQYYswsgDDDcjfitBjgIQBIQAxoDc2cxIiA1YzE3NWI3NmM5OWY0ZTNiMDdhYjNjYTdjMGMxZTE1MQ; ssid_ucp_v1=1.0.0-KDBjNTY5OTcxZTJmZWVmYjUzY2E5MzlmZjc3NjE1ZTg5YTQ1MTM2ZDEKHwiBiLaC6qSB32UQqevcsQYYswsgDDDcjfitBjgIQBIQAxoDc2cxIiA1YzE3NWI3NmM5OWY0ZTNiMDdhYjNjYTdjMGMxZTE1MQ; bm_sv=D79A28FB79A2AA2D4375DD11DD4C18D1~YAAQF+ercVc9wuCOAQAAa6epRxeAqWI6x+0yefULIDep3YqsjNwgfBm2kWiNqwij6CQ5KQm7TDvDUK9/SpQc24JkqUO/0YFeMTd/wcfNrTVDVHOXPUZAVG85ZNcb/3OEYkrZ3Kq1dC0Q3mzSl4SAhYSHayS9ST01XN9WPmYYLlV75VOjnmFTUOLXy21blJ9joWJJ7itmCwegH/k/akeSferkLz7/VP1IQzB6lekufKy1dJYLnmmIARnF/g6HSTs+~1; ttwid=1%7C67Ck6lGLYwQNpr4_BgqfE_qwgXKSWvwhSGTP9p93qTI%7C1714894254%7C63ebeeeb770ac8e61e9daedfde5fcc6382d36b346acf65716f81e8b0b724918d; odin_tt=f2f120d733694b449f2a768f887bba1b92d0bb81b7c6bda293bfa5b76ac470c5a292c50e6fb2fdedf1ea303fae9285c4bda91c95c028b42159712ca8eebbcead6a0d50805b5897ee2b1bc01bf68ed67c; perf_feed_cache={%22expireTimestamp%22:1715065200000%2C%22itemIds%22:[%227363561802946514177%22%2C%227335701134037830944%22]}; msToken=wa0a75jJLYjR8eO8Lss9t-xUeKu5X5ahcqxparKNrQ0kng22XiqVAXzvYPpdcnErVQjXglCNtlGObqExtO_GeWV3fGSPJvDGM60GggT2RdhbhNXPRqyQKFgW1PVZ4KbIRXCLsw==; msToken=8qaceELHDaBpHf50xECAaCnmT8ajkcXCHLPYI9Rj9tHM2uTj1b3sjEsP1W_ByS-AOQDPD0gwCELp6vPonrmgsUg6Gb5PGbWU_xbUd428yGlidDHpV7Vm8eMynrRDJf9HQXAquw==; useragent=TW96aWxsYS81LjAgKExpbnV4OyBBbmRyb2lkIDEwOyBLKSBBcHBsZVdlYktpdC81MzcuMzYgKEtIVE1MLCBsaWtlIEdlY2tvKSBDaHJvbWUvMTIwLjAuMC4wIE1vYmlsZSBTYWZhcmkvNTM3LjM2; _uafec=Mozilla%2F5.0%20(Linux%3B%20Android%2010%3B%20K)%20AppleWebKit%2F537.36%20(KHTML%2C%20like%20Gecko)%20Chrome%2F120.0.0.0%20Mobile%20Safari%2F537.36;",
        "Accept-Language": "vi-VN,vi;q=0.9"
      }
    });
    const awemeList = response.data?.aweme_list;
    if (!awemeList || awemeList.length === 0) {
      return { status: "error", message: "No videos found." };
    }

    if (aweme_id !== awemeList[0].aweme_id) {
      return { status: "error", message: "Invalid aweme_id." };
    }

    const firstVideo = awemeList[0];
    const music = {
      type: "Audio",
      title: firstVideo.music.title,
      duration: firstVideo.music.duration,
      url: firstVideo.music.play_url.url_list[0]
    };
    let result;
    if (firstVideo.image_post_info) {
      result = {
        type: "Photo",
        id: firstVideo.aweme_id,
        title: firstVideo.desc,
        nickname: firstVideo.author.nickname,
        unique_id: firstVideo.author.unique_id,
        create_at: convertDMY(firstVideo.create_time),
        commentCount: firstVideo.statistics.comment_count,
        likeCount: firstVideo.statistics.digg_count,
        downloadCount: firstVideo.statistics.download_count,
        playCount: firstVideo.statistics.play_count,
        shareCount: firstVideo.statistics.share_count,
        collectCount: firstVideo.statistics.collect_count,
        url: firstVideo.image_post_info.images.map((v) => v.display_image.url_list[0]),
        music
      };
    } else {
      result = {
        type: "Video",
        id: firstVideo.aweme_id,
        title: firstVideo.desc,
        nickname: firstVideo.author.nickname,
        unique_id: firstVideo.author.unique_id,
        create_at: convertDMY(firstVideo.create_time),
        commentCount: firstVideo.statistics.comment_count,
        likeCount: firstVideo.statistics.digg_count,
        downloadCount: firstVideo.statistics.download_count,
        playCount: firstVideo.statistics.play_count,
        shareCount: firstVideo.statistics.share_count,
        collectCount: firstVideo.statistics.collect_count,
        play: firstVideo.video.play_addr.url_list[0],
        wm: firstVideo.video.download_addr.url_list[0],
        music
      };
    }
    return result;
  } catch (error) {
    return {message: error.message };
  }
}

module.exports.tiktokSearchUser = async function(username, page) {
  var _tiktokurl = "https://www.tiktok.com"; 
  if (page === void 0) {
    page = 1;
  }
  return new Promise(function(resolve, reject) {
    var cursor = 0;
    for (var i = 1; i < page; i++) {
      cursor += 10;
    }
    var params = qs.stringify({
      WebIdLastTime: Date.now(),
      aid: "1988",
      app_language: "en",
      app_name: "tiktok_web",
      browser_language: "en-US",
      browser_name: "Mozilla",
      browser_online: true,
      browser_platform: "Win32",
      browser_version:
        "5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.0.0",
      channel: "tiktok_web",
      cookie_enabled: true,
      cursor: cursor,
      device_id: "7340508178566366722",
      device_platform: "web_pc",
      focus_state: false,
      from_page: "search",
      history_len: 5,
      is_fullscreen: false,
      is_page_visible: true,
      keyword: username,
      os: "windows",
      priority_region: "ID",
      referer: "",
      region: "ID",
      screen_height: 768,
      screen_width: 1366,
      search_id: "20240329123238075BE0FECBA0FE11C76B",
      tz_name: "Asia/Ho_Chi_Minh",
      web_search_code: {
        tiktok: {
          client_params_x: {
            search_engine: {
              ies_mt_user_live_video_card_use_libra: 1,
              mt_search_general_user_live_card: 1
            }
          },
          search_server: {}
        }
      },
      webcast_language: "en"
    });
    axios.get(_tiktokurl + "/api/search/user/full/?" + params, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.0.0",
        cookie: "_ttp=2UYKQrM4SmZZenItvveYVoKcRbi; tt_chain_token=xJitPcTGnRtRoIQbkG1Rpg==; tiktok_webapp_theme=light; uid_tt=718bd1d8fc4d8a6eaf7fe1bd59d2fedb46158b25e382d5e9c0277697edac7c23; uid_tt_ss=718bd1d8fc4d8a6eaf7fe1bd59d2fedb46158b25e382d5e9c0277697edac7c23; sid_tt=5c175b76c99f4e3b07ab3ca7c0c1e151; sessionid=5c175b76c99f4e3b07ab3ca7c0c1e151; sessionid_ss=5c175b76c99f4e3b07ab3ca7c0c1e151; store-idc=alisg; store-country-code=vn; store-country-code-src=uid; tt-target-idc=alisg; tt-target-idc-sign=IZqkoGplb7W_eUgHBchKFio2X3juz96L66dacqHNIFz54B9LeKsejGtoGBSO6USJ8EByFEkqwevpeEZH0fqHZa99vQaFtdbVk8gkBN8dM0yJIWObx4NM2v5Cser9N5bP1ZLKMBFnVLUVPaeVO1cxRJsq3b4UGBPJg0AKWufql0hV6YztnBXYDZ7GcFxpS9JfmnRxkQL2DcyQaIz0jIYgZEvzrOuOzYhf0-7M0AOhhj5URcnGOt7m8T0BQLqIcXaT80jNjk1RoRQ_2l8Nm_l0N_V1428nyjt37mu83zFDdYsx5Kt0n77JbpNbfWhHxY6pFSVt-Dcn5ElzRfLPwrp8Fj7PQsuWd3rtSXv-VR4Gd5g2zOiu5i9xJwOXLoWaEnuT_i9jsA5PkZ1bdt561DpoWBnJyPqz9gl2VBmcmIq0OeefZIVnxUvVVaP5TlUvrbTB6xLHJ37hrNd1vh8I63Ux7EwTIplI5zyA2seFtUcq8OF5EiebFe6wlmy7qQd2_sVr; sid_guard=5c175b76c99f4e3b07ab3ca7c0c1e151%7C1714894249%7C15552000%7CFri%2C+01-Nov-2024+07%3A30%3A49+GMT; sid_ucp_v1=1.0.0-KDBjNTY5OTcxZTJmZWVmYjUzY2E5MzlmZjc3NjE1ZTg5YTQ1MTM2ZDEKHwiBiLaC6qSB32UQqevcsQYYswsgDDDcjfitBjgIQBIQAxoDc2cxIiA1YzE3NWI3NmM5OWY0ZTNiMDdhYjNjYTdjMGMxZTE1MQ; ssid_ucp_v1=1.0.0-KDBjNTY5OTcxZTJmZWVmYjUzY2E5MzlmZjc3NjE1ZTg5YTQ1MTM2ZDEKHwiBiLaC6qSB32UQqevcsQYYswsgDDDcjfitBjgIQBIQAxoDc2cxIiA1YzE3NWI3NmM5OWY0ZTNiMDdhYjNjYTdjMGMxZTE1MQ; ak_bmsc=D2DEEC727557AEFA1880607B6FE355C8~000000000000000000000000000000~YAAQPfrSFxJ15FCPAQAA6WLbURdmUR/gHeSztWgtzKurxOL3mJV0aUiPcvBk+iH1Vdre0RF8KXR5I9GODF6zkG23sQyNlZg12bXjGxTf48ie0cYYavJAkF1O9FuIpfl1Oe8AFyJgswn+gbgIVR+nrLTh5RnCzQiDG1Z9Fa1NKI7GHQ4GlYN86dYhwMbkzivWw4Un0/59UZUnhwElv8L69xeHoFDok1wc1b/3bLqR09C/95zVMuAphVcTAumJsKB5bKiv+2higq3bvZiI2NciUpykHlKLkRBl9juYxFIycvojbB6yxRvu1R2U9Y4xqb8xcfTc2h/24tWsB5VAPe5f6Vozs6La3EG3rcuy8JzBMamISX3Q/RHKLMtInxoVZTj0jVvQ99XC62jEUUg=; perf_feed_cache={%22expireTimestamp%22:1715238000000%2C%22itemIds%22:[%227363552342131658002%22%2C%227358518193217965355%22]}; msToken=uaWSQvOgmRZIhpqFA2pI_SKTZnDuG9KVv1sVUeUFBlxneFYtMMlTaic0IM0G6VkjW7ITYreUB-ZwDe_oFAG0a-d6jUlp6tdzr4bUU234By2abOTTzdPB_sxhJ2gQkS3r-L6miw==; tt_csrf_token=PD1aN6hB-mYJmqDIbVtxwcu3QQzXCEeUMre8; bm_sv=DE7CFE8AF7503AA93D11B22CA7DF64D3~YAAQJ6TUF6SEuz+PAQAA6X/5URcS9p5ofwbJTZsqYHIzutcxINWNOfPIqpL+pAD8Xj+Zfg77FVmNlv9vXBkXU33ZdnGfbH3+xscFa3HIr5uE1qQ6v7L+wah7XPZB8WlbSnVc/cOY71x8jvv3jPRKHZEvH4Kq24B1yxhDV8SUMeel0s3+b/865RTQUixUB1Uc+MVyE2rq+NNwuwBJkzmMhjOHsur94UxQchm3T2APGQbxgY2nLJIVS0Mm4GVpTE3/~1; ttwid=1%7C67Ck6lGLYwQNpr4_BgqfE_qwgXKSWvwhSGTP9p93qTI%7C1715067260%7C6dbd9fbd09e7c57a15623ebec0c5d10374eb2528077f99d5fa9cd9ba137c1b0f; msToken=6isKTBvl-dtXWDjq6SEs2d_sWwXUDH5-ZaY6SY5GTBzKgkZtDXX7lo4qFAIymrNAa7lgYUUjHKZI3ne05NIVZyKXHt4m_YN4Fwskfo0kCv55gVpYtIf5GdbhT-zCd_Rs8e0Piw==; odin_tt=05f9d29517864fa23b1d17639309ff469ef07504ebec55b61575e8f683f3ee62da6861e1d5bcb71a801c3492277fa11b7dac24a54b5f53e489a15263a95a51e4dca54eb9815c981f8650c02168dbadb5; useragent=TW96aWxsYS81LjAgKExpbnV4OyBBbmRyb2lkIDEwOyBLKSBBcHBsZVdlYktpdC81MzcuMzYgKEtIVE1MLCBsaWtlIEdlY2tvKSBDaHJvbWUvMTIwLjAuMC4wIE1vYmlsZSBTYWZhcmkvNTM3LjM2; _uafec=Mozilla%2F5.0%20(Linux%3B%20Android%2010%3B%20K)%20AppleWebKit%2F537.36%20(KHTML%2C%20like%20Gecko)%20Chrome%2F120.0.0.0%20Mobile%20Safari%2F537.36;"}}).then(function(_ref) {
        var data = _ref.data;
        if (data.status_code !== 0) {
          return resolve({
            status: "error",
            message: "Không tìm thấy người dùng. Đảm bảo từ khóa bạn đang tìm kiếm là chính xác..."});
        }
        var result = [];
        for (var i = 0; i < data.user_list.length; i++) {
          var user = data.user_list[i];
          result.push({
            uid: user.user_info.uid,
            username: user.user_info.unique_id,
            nickname: user.user_info.nickname,
            signature: user.user_info.signature,
            followerCount: user.user_info.follower_count,
            avatarThumb: user.user_info.avatar_thumb,
            isVerified: user.custom_verify !== "",
            secUid: user.user_info.sec_uid,
            url: _tiktokurl + "/@" + user.user_info.unique_id
          });
        }
        resolve(result);
      }).catch(function(e) {
        resolve({ status: "error", message: e.message });
      });
  });
};

module.exports.pinterestdl = async function(Url) {
  return new Promise(async (resolve, reject) => {
    try {
      const isUrl = (str) => /^https?:\/\//.test(str);
      if (!isUrl(Url) || !/pinterest\.com|pin\.it/i.test(Url))
      throw new Error("Invalid URL: " + Url);
      const token = Buffer.from(Date.now().toString()).toString('base64');
      const response = await axios.post("https://getindevice.com/wp-json/aio-dl/video-data/", qs.stringify({ url: Url, token: token }), {
        headers: {
          "sec-ch-ua": '"Not)A;Brand";v="24", "Chromium";v="116"',
          "sec-ch-ua-platform": '"Android"',
          Referer: "https://getindevice.com/pinterest-video-downloader/",
          "sec-ch-ua-mobile": "?1",
          "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36",
         },
      });
      let url;
      let type;
      if (response.data.duration && response.data.medias.length >= 2) {
        type = "Video";
        url = response.data.medias[1].url;
      }
      if (!response.data.duration && response.data.medias.length === 1) {
        type = "Photo";
        url = response.data.medias[0].url;
      }
      const result = {
        type: type,
        title: response.data.title,
        duration: response.data.duration,
        url: url,
      };
      resolve(result);
    } catch (error) {
      resolve({
        status: 404,
        msg: error?.message || error,
      });
    }
  });
}
module.exports.douyindl = async function(url) {
    try {
        const response = await axios.post("https://savetik.co/api/ajaxSearch",
            qs.stringify({
                q: url,
                lang: "vi",
            }),
            {
                headers: {
                    Accept: "*/*",
                    "Accept-Encoding": "gzip, deflate, br, zstd",
                    "Accept-Language": "vi,en;q=0.9",
                    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                    Cookie: "FCNEC=%5B%5B%22AKsRol8Cm7KZJVT1qv76DomWq2i9YS9_gqrH_1Pd5lZUx6mCYU7N55B7sewdtWwhYU2H7Ch9Qck2F1jxBATuhS_61mFVzc6mUtbSwOtuGx-RqFJBy_4DwhpGKDBx_d9n0o77JEV2RhVjRbX4UGVDzu5ycSEHyFgVhw%3D%3D%22%5D%5D; _gid=GA1.2.239355849.1721362453; _gat_gtag_UA_88358110_1=1; _ga_4ZEZMTBFLJ=GS1.1.1721362453.1.0.1721362453.0.0.0; _ga=GA1.1.1671159918.1721362453; __gads=ID=26da3097086e8079:T=1721361782:RT=1721362453:S=ALNI_MYjRDY_JVe50XpAu_1rbqKQqpG40A; __gpi=UID=00000e9aa3a64eae:T=1721361782:RT=1721362453:S=ALNI_Malvpt443_LedIPzqfPYpuc6mNeOQ; __eoi=ID=c3a5b87e2e314d36:T=1721361782:RT=1721362453:S=AA-AfjbNonNrnf1ktKJtf1XgGOWL",
                    Origin: "https://savetik.co",
                    Referer: "https://savetik.co/vi/douyin-downloader",
                    "Sec-Ch-Ua": '"Google Chrome";v="125", "Chromium";v="125", "Not.A/Brand";v="24"',
                    "Sec-Ch-Ua-Mobile": "?0",
                    "Sec-Ch-Ua-Platform": '"Windows"',
                    "Sec-Fetch-Dest": "empty",
                    "Sec-Fetch-Mode": "cors",
                    "Sec-Fetch-Site": "same-origin",
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
                    "X-Requested-With": "XMLHttpRequest",
                },
            },
        );        
        const $ = cheerio.load(response.data.data);
        const results = {
              id: "",
              title: "", 
              audio: "",
              attachments: []
            };
        results.title = $('div.tik-video div.thumbnail div.content h3').text().trim();
        results.id = $('#TikTokId').val();
        results.audio = $('a#ConvertToVideo').data('audiourl') || "";
        const photos = [];
        $('div.photo-list ul.download-box li div.download-items__thumb img').each((index, element) => {
          const imageUrl = $(element).attr('src');
          if (imageUrl) {
            photos.push(imageUrl);
          }
        });
       const videoUrls = [];
    $('a.tik-button-dl').each((index, element) => {
      videoUrls.push($(element).attr('href'));
    });
        if (photos.length > 0) {
      photos.forEach(imageUrl => {
        results.attachments.push({ type: "Photo", url: imageUrl });
      });
    } else if (videoUrls.length > 1) {
      results.attachments.push({ type: "Video", url: videoUrls[1] });
    }
        return results;
    } catch (error) {
        console.error("Error:", error);
    }
}
module.exports.igdlv2 = async function(url) {
    try {
const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
  };
        const response = await axios.get(`https://v3.saveinsta.app/api/ajaxSearch?q=${url}&t=media&lang=vi`, {headers});
        const $ = cheerio.load(response.data.data);
        const videoDownloadLinks = [];
        $('ul.download-box li').each((index, element) => {
            const button = $(element).find('div.download-items__btn a[onclick*=click_download_video]');
            if (button.length > 0) {
                const url = button.attr('href');
                videoDownloadLinks.push(url);
            }
        });          
        return { data: videoDownloadLinks};
    } catch (error) {
        console.error(error);
        return `Lỗi rồi`;
    }
}
module.exports.igdlv3 = async function(url) {
    try {
        let res = await axios.get("https://indown.io/");
        let _$ = cheerio.load(res.data);
        let referer = _$("input[name=referer]").val();
        let locale = _$("input[name=locale]").val();
        let _token = _$("input[name=_token]").val();
        let a = await axios.post("https://indown.io/download", new URLSearchParams({
                link: url,
                referer,
                locale,
                _token,
            }), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    cookie: res.headers["set-cookie"].join("; "),
                },
            });
        let $ = cheerio.load(a.data);
        let result = [];
        let __$ = cheerio.load($("#result").html());
        __$("video").each(function () {
            let $$ = $(this);
            result.push({
                type: "Video",
                url: $$.find("source").attr("src"),
            });
        });
        __$("img").each(function () {
            let $$ = $(this);
            result.push({
                type: "Photo",
                url: $$.attr("src"),
            });
        });
        return result;
    } catch (error) {
        console.error(error);
        return [];
    }
}

module.exports.fbdlv2 = async function(url) {
  try {
    const getToken = (await axios.get("https://fdownloader.net")).data;
    const k_exp = getToken.split('k_exp="')[1].split('"')[0];
    const k_token = getToken.split('k_token="')[1].split('"')[0];
    const data = qs.stringify({
      'k_exp': k_exp,
      'k_token': k_token,
      'q': url
    });
    const config = {
      method: 'post',
      url: 'https://v3.fdownloader.net/api/ajaxSearch?lang=en',
      headers: {
        "Accept": "*/*",
        "Origin": "https://fdownloader.net",
        "Referer": "https://fdownloader.net/",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "en-US,en;q=0.9",
        "Content-Type": "application/x-www-form-urlencoded",
        "Sec-Ch-Ua": '"Not/A)Brand";v="99", "Microsoft Edge";v="115", "Chromium";v="115"',
        "Sec-Ch-Ua-Mobile": "?0",
        "Sec-Ch-Ua-Platform": '"Windows"',
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36 Edg/115.0.1901.183",
        "X-Requested-With": "XMLHttpRequest",
      },
      data: data
    };
    const res = await axios(config);
    const dataContent = res.data.data;
    const thumb = dataContent.split('<img src="')[1].split('">')[0].replace(/;/g, "&");
    const audio = dataContent.split('id="audioUrl" value="')[1].split('"')[0].replace(/;/g, "&");
    const time = dataContent.split('clearfix')[1].split('<p>')[1].split("</p>")[0];
    const HD = dataContent.split('" rel="nofollow"')[0].split('<td>No</td>')[1].split('"')[1].replace(/;/g, "&");
    const SD = dataContent.split('>360p (SD)</td>')[1].split('<a href="')[1].split('"')[0].replace(/;/g, "&");
    return {
      duration: time,
      thumb: thumb,
      url: HD
    };
  } catch (e) {
    return 'Lỗi';
  }
}

module.exports.facebookdlv2 = async (url, accessToken) => {
    const handleError = (error) => {
        console.error(error);
        return { message: error.message };
    };

    const getPostData = async (pageUrl, postId, accessToken) => {
        try {
            const getUserId = (await axios.get(`https://fbuid.mktsoftware.net/api/v1/fbprofile?url=${pageUrl}`)).data;
            const graphPostUrl = `https://graph.facebook.com/v19.0/${getUserId.uid}_${postId}?fields=message,shares,reactions.summary(true),comments.summary(true),attachments&access_token=${accessToken}`;
            const response = await axios.get(graphPostUrl);
            if (response.data) {
                const postData = {
                    message: response.data.message || "Không có tiêu đề",
                    like: response.data.reactions ? response.data.reactions.summary.total_count : 0,
                    comment: response.data.comments ? response.data.comments.summary.total_count : 0,
                    share: response.data.shares ? response.data.shares.count : 0,
                    attachments: response.data.attachments ? response.data.attachments.data.reduce((acc, attachment) => {
                        if (attachment.subattachments && attachment.subattachments.data.length > 0) {
                            attachment.subattachments.data.forEach((data) => {
                                acc.push({
                                    type: data.type,
                                    url: data.media.image.src
                                });
                            });
                        }
                        if (attachment.type === 'photo' || attachment.type === 'profile_media') {
                            acc.push({
                                type: "photo",
                                url: attachment.media.image.src
                            });
                        }
                        if (attachment.type === 'video_inline') {
                            acc.push({
                                type: "video",
                                url: attachment.media.source
                            });
                        }
                        return acc;
                    }, []) : []
                };
                return postData;
            }
        } catch (error) {
            return handleError(error);
        }
    };

    const getPhotoData = async (postId, accessToken) => {
        try {
            const graphPhotoUrl = `https://graph.facebook.com/v19.0/${postId}?fields=source,reactions.summary(total_count),comments.summary(total_count)&access_token=${accessToken}`;
            const response = await axios.get(graphPhotoUrl);
            if (response.data) {
                const photoData = {
                    message: response.data.message || "Không có tiêu đề",
                    like: response.data.reactions ? response.data.reactions.summary.total_count : 0,
                    comment: response.data.comments ? response.data.comments.summary.total_count : 0,
                    attachments: response.data.source ? [{
                        type: "photo",
                        url: response.data.source
                    }] : []
                };
                return photoData;
            }
        } catch (error) {
            return handleError(error);
        }
    };

    const getStoryData = async (postId, accessToken) => {
        try {
            const graphStoryUrl = `https://graph.facebook.com/v19.0/${postId}?fields=message,shares,reactions.summary(total_count),comments.summary(total_count),attachments&access_token=${accessToken}`;
            const response = await axios.get(graphStoryUrl);
            if (response.data) {
                const storyData = {
                    message: response.data.message || "Không có tiêu đề",
                    like: response.data.reactions ? response.data.reactions.summary.total_count : 0,
                    comment: response.data.comments ? response.data.comments.summary.total_count : 0,
                    share: response.data.shares ? response.data.shares.count : 0,
                    attachments: response.data.attachments ? response.data.attachments.data.reduce((acc, attachment) => {
                        if (attachment.subattachments && attachment.subattachments.data.length > 0) {
                            attachment.subattachments.data.forEach((data) => {
                                acc.push({
                                    type: data.type,
                                    url: data.media.image.src
                                });
                            });
                        }
                        if (attachment.type === 'photo' || attachment.type === 'profile_media') {
                            acc.push({
                                type: "photo",
                                url: attachment.media.image.src
                            });
                        }
                        if (attachment.type === 'video_inline') {
                            acc.push({
                                type: "video",
                                url: attachment.media.source
                            });
                        }
                        return acc;
                    }, []) : []
                };
                return storyData;
            }
        } catch (error) {
            return handleError(error);
        }
    };

    const getReelData = async (reelId, accessToken) => {
        try {
            const graphReelUrl = `https://graph.facebook.com/v19.0/${reelId}?fields=description,source,reactions.summary(total_count),comments.summary(total_count)&access_token=${accessToken}`;
            const response = await axios.get(graphReelUrl);
            if (response.data) {
                const reelData = {
                    message: response.data.description || "Không có mô tả",
                    like: response.data.reactions ? response.data.reactions.summary.total_count : 0,
                    comment: response.data.comments ? response.data.comments.summary.total_count : 0,
                    attachments: response.data.source ? [{
                        type: "video",
                        url: response.data.source
                    }] : []
                };
                return reelData;
            }
        } catch (error) {
            return handleError(error);
        }
    };

const linkShareRegex = /^https:\/\/www\.facebook\.com\/share\/\w+\/\?mibextid=\w+$/; 
const postLinkShareRegex = /^https:\/\/www\.facebook\.com\/share\/v\/\w+\/\?mibextid=\w+$/;
    const reelLinkShareRegex = /^https:\/\/www\.facebook\.com\/share\/r\/\w+\/\?mibextid=\w+$/;
    const storyLinkShareRegex = /^https:\/\/www\.facebook\.com\/share\/p\/\w+\/\?mibextid=\w+$/;
    const groupPermalinkRegex = /^(?:https?:\/\/)?(?:www\.)?facebook\.com\/groups\/[^\/]+\/permalink\/\d+\/?$/;
    const reelVideoRegex = /^(?:https?:\/\/)?(?:www\.)?facebook\.com\/reel\/(\d+)\?mibextid=\w+$/;
    const storyVideoRegex = /^https:\/\/www\.facebook\.com\/story\.php\?story_fbid=[^&]+&id=\d+&post_id=[^&]+&mibextid=\w+$/;
    const srcapistoryVideoRegex = /^https:\/\/www\.facebook\.com\/story\.php\?story_fbid=[^&]+\/\d+/;
    const photoRegex = /^https:\/\/www\.facebook\.com\/photo\.php\?fbid=\d+(&set=a\.\d+&type=\d+&mibextid=\w+)?$/;
    const watchVideoRegex = /^https:\/\/fb\.watch\/[a-zA-Z0-9]+(?:\/\?[^/]+)?$/;
    const storiesVideoRegex = /^https?:\/\/(?:www|m)\.facebook\.com\/stories\/[0-9]+\/[A-Za-z0-9%+=]+\/?(?:\?[^/]+)?$/;
    const regexCombined = /^(?:https?:\/\/)?(?:www\.)?facebook\.com\/(?:[^\/]+\/(?:posts\/\w+\/?|videos\/\d+\/?(?:\?.*)?)|\d+\/posts\/[a-zA-Z0-9]+\/\?substory_index=\d+&app=fbl)/;

    let pageUrl, postId, reelId;
   if (postLinkShareRegex.test(url)) {
        try {
            const response = await axios.get(url);
            const responseData = response.request.res.responseUrl;
            const urlParts = responseData.split('/');
            const userId = urlParts[urlParts.length - 5];
            postId = urlParts[urlParts.length - 2];
            pageUrl = `https://www.facebook.com/${userId}`;
            return await getPostData(pageUrl, postId, accessToken); 
        } catch (error) {
            console.error('Error:', error);
            return handleError(error);
        }
    } else if (reelLinkShareRegex.test(url)) {
        try {
    const response = await axios.get(url);
    const responseData = response.request.res.responseUrl;
const res = await axios('https://x2download.app/api/ajaxSearch/facebook',{
                method: "POST",
                data: "q=" + encodeURIComponent(responseData)
            });
            const p = res.data;
            return {
                "message": p.title,
                "attachments": [{
                    "url": {
                        "hd": p.links.hd,
                        "sd": p.links.sd
                    }
                }]
            };
        } catch (error) {
            console.error('Error:', error);
            return handleError(error);
        }
} else if (storyLinkShareRegex.test(url)) {
try {
    const response = await axios.get(url);
    const responseData = response.request.res.responseUrl;
    if (responseData.includes("https://www.facebook.com/login/?next=")) {
       const urlParts = responseData.replace('https://www.facebook.com/login/?next=', '');
        const decodedURL = decodeURIComponent(urlParts);
        userId = decodedURL.split('id=')[2].split('&')[0];
        const idstory = decodedURL.split('story_fbid=')[1].split('&')[0];
        postId = `${userId}_${idstory}`;
        return await getStoryData(postId, accessToken);
} 
   if (responseData.includes("https://www.facebook.com/groups/")) {
        const urlParts = responseData.split('/');
        userId = urlParts[4];
        postId = urlParts[6];
        pageUrl = `https://www.facebook.com/groups/${userId}`;
        return await getPostData(pageUrl, postId, accessToken); 
    }
} catch (error) {
    console.error('Error:', error);
    return handleError(error);
}
} else if (url.includes("https://www.facebook.com/groups")) {
        const urlParts = url.split('/');
        const userId = urlParts[4];
        pageUrl = `https://www.facebook.com/groups/${userId}`;
        postId = urlParts[6];
        return await getPostData(pageUrl, postId, accessToken); 
    } else if (reelVideoRegex.test(url)) {
        reelId = url.split('reel/')[1].split('?')[0];
        return await getReelData(reelId, accessToken); 
    } else if (storyVideoRegex.test(url)) {
        const postId = url.split('post_id=')[1].split('&')[0];
        return await getStoryData(postId, accessToken); 
    } else if (srcapistoryVideoRegex.test(url)) {
        const urlParts = url.split('/');
        postId = urlParts[4];
        return await getStoryData(postId, accessToken); 
    } else if (regexCombined.test(url)) {
        const urlParts = url.split('/');
        postId = urlParts[5];
        const userId = urlParts[3];
        pageUrl = `https://www.facebook.com/${userId}`;
        return await getPostData(pageUrl, postId, accessToken); 
    } else if (photoRegex.test(url)) {
        postId = url.split('fbid=')[1].split('&')[0];
        return await getPhotoData(postId, accessToken); 
    } else if (storiesVideoRegex.test(url) || watchVideoRegex.test(url) || linkShareRegex.test(url)) {
        try {
            const res = await axios('https://x2download.app/api/ajaxSearch/facebook',{
                method: "POST",
                data: "q=" + encodeURIComponent(url)
            });
            const p = res.data;
            return {
                "message": p.title,
                "attachments": [{
                    "url": {
                        "hd": p.links.hd,
                        "sd": p.links.sd
                    }
                }]
            };
        } catch (error) {
            console.error('Error:', error);
            return handleError(error);
        }
    } else {
        return { message: "URL không hợp lệ!" };
    }
};

module.exports.capcutdlv2 = async function(url) {
   const domain = 'https://www.capcut.com/';
   async function getCookies() {
    try {
        const response = await axios.get(domain),
            cookies = response.headers['set-cookie'],
            parsedCookies = cookies.map(cookie => cookie.split('; ')[0]);
        return parsedCookies;
    } catch (error) {
        throw error;
    }
}
function updateUrls(data) {
    const originalUrlsPattern = /("originalVideoUrl": "| "authorUrl": "|"coverUrl": ")(\/[^"]+)/g,
        updatedData = JSON.stringify(data, null, 4).replace(originalUrlsPattern, (match, prefix, url) => prefix + domain + url);
    return JSON.parse(updatedData);
}
    try {
        const isUrlValid = url => /^https?:\/\//.test(url);
        if (!isUrlValid(url) || !/capcut\.com/i.test(url)) throw new Error('Invalid URL: ' + url);
        const cookies = await getCookies(),
            videoId = url.match(/\d+/)[-1],
            {
               data: videoData
            } = await axios.get(`${domain}web/medias/redirect/${videoId}`, {
                'headers': {
                    'authority': 'www.capcut.com',
                    'accept': '*/*',
                    'accept-language': 'en-US,en;q=0.9',
                    'cookie': cookies.join('; '),
                    'referer': 'https://www.capcut.com/',
                    'sec-ch-ua': '"Chromium";v="88"',
                    'sec-ch-ua-mobile': '?1',
                    'sec-ch-ua-platform': 'Windows',
                    'sec-fetch-dest': 'empty',
                    'sec-fetch-mode': 'cors',
                    'sec-fetch-site': 'same-origin',
                    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.150 Safari/537.36'
                }
            });
        return {
            'status': 0xc8,
            ...updateUrls(videoData)
        };
    } catch (error) {
        return {
            'status': 0x194,
            'msg': error?.message || error
        };
    }
}

module.exports.tiktokdlv3 = async function(url) {
  const TiktokURLregex = /https:\/\/(?:m|www|vm|vt|lite)?\.?tiktok\.com\/((?:.*\b(?:(?:usr|v|embed|user|video)\/|\?shareId=|\&item_id=)(\d+))|\w+)/g;
  const _ssstikurl = "https://ssstik.io";
  if (!TiktokURLregex.test(url)) {
    throw new Error("Invalid Tiktok URL. Make sure your URL is correct!");
  } try {
    const { data: ssstikData } = await axios.get(_ssstikurl,{
      headers: {
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/111.0"
      }
    });
    const regex = /s_tt\s*=\s*["']([^"']+)["']/;
    const match = ssstikData.match(regex);
    if (!match) {
      throw new Error("Failed to get the request form!");
    }
    const tt = match[1];
    const { data } = await axios.post("https://ssstik.io/abc?url=dl", new URLSearchParams({
      id: url,
      locale: "en",
      tt }), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        Origin: "https://ssstik.io",
        Referer: "https://ssstik.io/en",
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/111.0"
      }});
    const $ = cheerio.load(data);
    const title = $("p.maintext").text().trim() || null;
    const author = $("h2").text().trim() || null;
    const like = $("#trending-actions > .justify-content-start").text().trim() || null;
    const comment = $("#trending-actions > .justify-content-center").text().trim() || null;
    const share = $("#trending-actions > .justify-content-end").text().trim() || null;
    const images = $("ul.splide__list > li").map((_, img) => $(img).find("a").attr("href")).get();
    const music = $("a.music").attr("href");
    if (images.length) {
      return {
        type: "Photo",
        title,
        author,
        like,
        comment,
        share,
        url: images,
        music
      };
    } else {
      const url = $("a.without_watermark").attr("href");
      return {
        type: "Video",
        title,
        author,
        like,
        comment,
        share,
        url,
        music
      };
    }
  } catch (e) {
    throw new Error(e.message);
  }
};

module.exports.text2img = async function(text) {
  try {
    const { data } = await axios.get("https://tti.photoleapapp.com/api/v1/generate?prompt=" + text);
    const result = { url: data.result_url };
    return result;
  } catch (err) {
    const result = {
      message: String(err)
    };
    return result;
  }
}

module.exports.tiktokStalk = async function(user) {
  try {
    const { data } = await axios.get(`https://tiktok.com/@${user}`, {
      headers: {
        "User-Agent": "PostmanRuntime/7.32.2"
      }
    });
    const $ = cheerio.load(data);
    const dats = $("#__UNIVERSAL_DATA_FOR_REHYDRATION__").text();
    const result = JSON.parse(dats)
    if (result["__DEFAULT_SCOPE__"]["webapp.user-detail"].statusCode !== 0) {
      const ress = {
        status: "error",
        message: "User not found!"
      }
      return ress;
    };
    const res = result["__DEFAULT_SCOPE__"]["webapp.user-detail"]["userInfo"];
    return res;
  } catch (err) {
    return String(err);
  }
}

module.exports.tiktokdlv4 = async function(url) {
  let result = {};
  try {
    const { data } = await axios({
      method: "post",
      url: "https://tikdownloader.io/api/ajaxSearch",
      data: new URLSearchParams({ q: url, lang: "id" }),
      headers: {
        Accept: "*/*",
        "Content-Type": "application/x-www-form-urlencoded",
        "X-Requested-With": "XMLHttpRequest"
      }
    });
    let $ = cheerio.load(data.data);
    const attachments = [];
    const title = $("div.video-data > div > .tik-left > .thumbnail > .content > .clearfix > h3").text();
    if ($("div.video-data > .photo-list").length === 0) {
      const videoUrl1 = $("div.video-data > div > .tik-right > div > p:nth-child(1) > a").attr("href");
      const videoUrl2 = $("div.video-data > div > .tik-right > div > p:nth-child(2) > a").attr("href");
      const videoUrlHD = $("div.video-data > div > .tik-right > div > p:nth-child(3) > a").attr("href");
      const audioUrl = $("div.video-data > div > .tik-right > div > p:nth-child(4) > a").attr("href");
      attachments.push(
        {
          type: "Video",
          url: videoUrlHD || videoUrl1 || videoUrl2,
        },
        {
          type: "Audio",
          url: audioUrl,
        }
      );
      result = {
        title,
        attachments,
      };
    } else {
      const audioUrl = $("div.video-data > div > .tik-right > div > p:nth-child(2) > a").attr("href");
      $("div.video-data > .photo-list > ul > li").each(function () {
        const photoUrl = $(this).find("div > div:nth-child(2) > a").attr("href");
        attachments.push({
          type: "Photo",
          url: photoUrl,
        });
      });
      attachments.push({
        type: "Audio",
        url: audioUrl,
      });
      result = {
        title,
        attachments,
      };
    }
    return result;
  } catch (err) {
    result = {
      status: false,
      message: "Video not found!",
      messageCmd: String(err)
    };
    return result;
  }
}

module.exports.tiktokdlv5 = async function(url) {
  let result = {};
  const bodyForm = new FormData();
  bodyForm.append("q", url);
  bodyForm.append("lang", "id");
  try {
    const { data } = await axios.post('https://savetik.co/api/ajaxSearch', bodyForm, {
      headers: {
        ...bodyForm.getHeaders(),
        'User-Agent': 'PostmanRuntime/7.32.2'
      }
    });
    const $ = cheerio.load(data.data);
    const attachments = [];
    const title = $('div.video-data > div > .tik-left > .thumbnail > .content > .clearfix > h3').text();
    if ($('div.video-data > .photo-list').length === 0) {
      const videoUrl = $('div.video-data > div > .tik-right > div > p:nth-child(3) > a').attr('href');
      const audioUrl = $('div.video-data > div > .tik-right > div > p:nth-child(4) > a').attr('href');
      attachments.push(
        {
          type: "Video",
          url: videoUrl,
        },
        {
          type: "Audio",
          url: audioUrl,
        });
      result = {
        title,
        attachments,
      };
    } else {
      const audioUrl = $('div.video-data > div > .tik-right > div > p:nth-child(2) > a').attr('href');
      $('div.video-data > .photo-list > ul > li').each(function () {
        const photoUrl = $(this).find('div > div:nth-child(2) > a').attr('href');
        attachments.push({
          type: "Photo",
          url: photoUrl,
        });
      });
      attachments.push({
        type: "Audio",
        url: audioUrl,
      });
      result = {
        title,
        attachments,
      };
    }
    return result;
  } catch (err) {
    result = {
      status: false,
      message: "Video not found!"
    };
    return result;
  }
}

module.exports.pinterdl = async function(link) {
    const randomUserAgent = () => {
    const versions = ["4.0.3", "4.1.1", "4.2.2", "4.3", "4.4", "5.0.2", "5.1", "6.0", "7.0", "8.0", "9.0", "10.0", "11.0"];
    const devices = ["M2004J19C", "S2020X3", "Xiaomi4S", "RedmiNote9", "SamsungS21", "GooglePixel5"];
    const builds = ["RP1A.200720.011", "RP1A.210505.003", "RP1A.210812.016", "QKQ1.200114.002", "RQ2A.210505.003"];
    const chromeVersion = `Chrome/${Math.floor(Math.random() * 80) + 1}.${Math.floor(Math.random() * 999) + 1}.${Math.floor(Math.random() * 9999) + 1}`;
    return `Mozilla/5.0 (Linux; Android ${versions[Math.floor(Math.random() * versions.length)]}; ${devices[Math.floor(Math.random() * devices.length)]} Build/${builds[Math.floor(Math.random() * builds.length)]}) AppleWebKit/537.36 (KHTML, like Gecko) ${chromeVersion} Mobile Safari/537.36 WhatsApp/1.${Math.floor(Math.random() * 9) + 1}.${Math.floor(Math.random() * 9) + 1}`;
  };
  const randomIP = () => `${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`;
  const headerss = () => ({
    "User-Agent": randomUserAgent(),
    "X-Forwarded-For": randomIP(),
  });
  async function unshortenUrl(shortUrl) {
        try {
            const response = await got(shortUrl, {
                followRedirect: true,
                maxRedirects: 5,
                timeout: 5000
            });
            return response.url;
        } catch(error) {
            throw new Error("Error unshortening URL: " + error.message);
        }
    }
    async function getPinIdFromUrl(url) {
        let pinIdRegex;
        if (url.includes('pinterest.com/pin/')) {
            pinIdRegex = /\/pin\/(\d+)/;
        } else if (url.includes('pin.it')) {
            try {
                const fullUrl = await unshortenUrl(url);
                pinIdRegex = /\/pin\/(\d+)/;
                url = fullUrl;
            } catch (error) {
                throw new Error("Error unshortening URL: " + error.message);
            }
        } else {
            throw new Error("Invalid Pinterest URL");
        }
        const pinIdMatch = url.match(pinIdRegex);
        if (pinIdMatch && pinIdMatch[1]) {
            return pinIdMatch[1];
        } else {
            throw new Error("Invalid Pinterest URL");
        }
    } try {
        const pinId = await getPinIdFromUrl(link);
        const response = await axios.get(`https://www.pinterest.com/resource/PinResource/get/?source_url=/pin/${pinId}/&data={"options":{"field_set_key":"detailed","id":"${pinId}"},"context":{}}`, { headers: {
         'X-Requested-With': 'XMLHttpRequest',
         ...headerss(),
         'Referer': `https://www.pinterest.com/pin/${pinId}/`}});
const pinData = response.data?.resource_response?.data;
const gifs = [{type: "Gif", url: pinData?.embed?.src}];
const photos = pinData?.story_pin_data?.pages.filter(page=>page?.blocks).map(page=>page?.image?.images["750x"]?.url).map(url=>({type: "Photo",url:url}));
const videos = pinData?.story_pin_data?.pages.filter(page=>page.video).map(page => page.blocks).map(block=>block.map(item=>item?.video?.video_list?.V_EXP6?.url));
const video = pinData?.story_pin_data?.pages.filter(page=>page.blocks).map(page => page.blocks).map(block=>block.map(item=>item?.video?.video_list?.V_EXP6?.url)).map(urls=>({type:"Video",url: urls[0]}));
const attachments = [];
if (gifs[0]?.url) {
    attachments.push({ type: gifs[0].type, url: gifs[0].url });
} else if (photos.length > 0 && video.length > 0) {
    attachments.push({ type: video[0].type, url: video[0].url });
} else if (photos.length > 0 && videos.length > 0) {
    attachments.push({ type: "Video", url: videos[0] });
} else if (video.length > 0) {
    attachments.push({ type: video[0].type, url: video[0].url });
} else if (photos.length > 0 && !video && !videos) {
    attachments.push({ type: photos[0].type, url: photos[0].url });
} else if (videos.length > 0) {
    attachments.push(...videos.map(url => ({ type: "Video", url: url })));
}
        return {
            id: pinData.id,
            title: pinData.title || "Không có tiêu đề",
            author: `${pinData.native_creator.full_name} (${pinData.native_creator.username})`,
            comment: pinData.comment_count,
            share: pinData.share_count,
            repin: pinData.repin_count,
            created_at: pinData.created_at,
            attachments
        };
    } catch (error) {
        console.error(`Có lỗi xảy ra: ${error.message}`);
        return null;
    }
}

module.exports.spotifydlv2 = async function(url) {
  const headers = {
    'Content-Type': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9',
    Origin: "https://spotifydown.com",
    Referer: "https://spotifydown.com/"
  };
  if (url.includes("spotify.link")) {
    const getOriginalUrl = async () => {
      const data = await axios.get(url);
      return data.request.res.responseUrl;
    };
    const originalUrl = await getOriginalUrl(url);
    const track = await axios.get(`https://api.spotifydown.com/metadata/track/${originalUrl.split("track/")[1].split("?")[0]}`, { headers });
    const { data } = await axios.get(`https://api.spotifydown.com/download/${track.data.id}`, { headers });
    return data;
  } else if (url.includes("open.spotify.com")) {
    const { data } = await axios.get(`https://api.spotifydown.com/download/${url.split("track/")[1].split("?")[0]}`, { headers });
    return data;
  } else {
    const result = {
      status: false,
      message: "Please input valid Spotify URL"
    };
    return result;
  }
}

module.exports.nhaccuatuidl = async function(url) {
    const form = new FormData();
    form.append('link', url);
    try {
        const response = await axios.post('https://m.vuiz.net/getlink/nhaccuatui/api.php', form, {
            headers: {
                ...form.getHeaders()
            }
        });
        const res = response.data;            
        const $ = cheerio.load(res.success);
        const audioElement = $('#amazingaudioplayer-1 ul.amazingaudioplayer-audios li').first();
        const data = {
         title: audioElement.attr('data-title'),
         artist: audioElement.attr('data-artist'),
         thumb: audioElement.attr('data-image'),
         duration: audioElement.attr('data-duration'),
         source: audioElement.find('.amazingaudioplayer-source').attr('data-src'),
        type: audioElement.find('.amazingaudioplayer-source').attr('data-type')
    };
    const medias = [];
    $('.menu div a').each((index, element) => {
        const link = $(element).attr('href');
        const quality = $(element).text().trim();
        medias.push({
              link,
              quality
             });
         });      
      return { data, medias };
    } catch (error) {
      console.error(error.message);
    }
}

module.exports.scldlv2 = async function (url) {
  if (typeof url !== 'string' || !url.startsWith('http')) throw new Error("Please input a valid URL");
  if (!url.includes("soundcloud.com")) throw new Error("Invalid SoundCloud URL");
  try {
    const response = await axios.post('https://api.downloadsound.cloud/track', { url: url }, { headers: {
        "Content-Type": "application/json",
        "Accept-Language": "vi,en-US;q=0.9,en;q=0.8",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36 Edg/109.0.1518.55"
      }});
    return response.data;
  } catch (err) {
    console.log(err);
  }
}

module.exports.zingmp3dl = async function(url) {
    const form = new FormData();
    form.append('link', url);
    try {
        const response = await axios.post('https://m.vuiz.net/getlink/mp3zing/apizing.php', form, {
            headers: {
                ...form.getHeaders()
            }
        });
        const res = response.data;            
        const $ = cheerio.load(res.success);
        const audioElement = $('#amazingaudioplayer-1 ul.amazingaudioplayer-audios li').first();
        const data = {
         title: audioElement.attr('data-title'),
         artist: audioElement.attr('data-artist'),
         thumb: audioElement.attr('data-image'),
         duration: audioElement.attr('data-duration'),
         source: audioElement.find('.amazingaudioplayer-source').attr('data-src'),
        type: audioElement.find('.amazingaudioplayer-source').attr('data-type')
    };
    const medias = [];
    $('.menu div a').each((index, element) => {
        const link = $(element).attr('href');
        const quality = $(element).text().trim();
        medias.push({
              link,
              quality
             });
         });      
      return { data, medias };
    } catch (error) {
      console.error(error.message);
    }
}

module.exports.capcutdlv2 = async function(url) {
     const randomUserAgent = () => {
    const versions = ["4.0.3", "4.1.1", "4.2.2", "4.3", "4.4", "5.0.2", "5.1", "6.0", "7.0", "8.0", "9.0", "10.0", "11.0"];
    const devices = ["M2004J19C", "S2020X3", "Xiaomi4S", "RedmiNote9", "SamsungS21", "GooglePixel5"];
    const builds = ["RP1A.200720.011", "RP1A.210505.003", "RP1A.210812.016", "QKQ1.200114.002", "RQ2A.210505.003"];
    const chromeVersion = `Chrome/${Math.floor(Math.random() * 80) + 1}.${Math.floor(Math.random() * 999) + 1}.${Math.floor(Math.random() * 9999) + 1}`;
    return `Mozilla/5.0 (Linux; Android ${versions[Math.floor(Math.random() * versions.length)]}; ${devices[Math.floor(Math.random() * devices.length)]} Build/${builds[Math.floor(Math.random() * builds.length)]}) AppleWebKit/537.36 (KHTML, like Gecko) ${chromeVersion} Mobile Safari/537.36 WhatsApp/1.${Math.floor(Math.random() * 9) + 1}.${Math.floor(Math.random() * 9) + 1}`;
  };
  const randomIP = () => `${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`;
      const headersss = () => ({
    "User-Agent": randomUserAgent(),
    "X-Forwarded-For": randomIP(),
     });
    const extractLinks = (text) => {
      const regex = /(https:\/\/www.capcut.com\/t\/[a-zA-Z0-9_-]+)|(https:\/\/www.capcut.com\/template-detail\/[a-zA-Z0-9_-]+)/g;
      const matches = text.match(regex);
      return matches ? matches[0] : null;
    };
    const link = extractLinks(url);
    if (!link) {
      throw new Error('Link này không phải là link mẫu capcut, vui lòng thay bằng link mẫu capcut');
    }
    const a = await axios.get(`https://ssscap.net/api/download/get-url?url=${link}`);
    const videoId = a.data.url.split("/")[4].split("?")[0];
    const headers = {
        'Accept': 'application/json, text/plain, */*',
        'Accept-Encoding': 'gzip, deflate, br, zstd',
        'Accept-Language': 'vi,en;q=0.9',
        'App-Sdk-Version': '48.0.0',
        'Appvr': '5.8.0',
        'Content-Type': 'application/json',
        'Cookie': 'passport_csrf_token=fea6749fed6008d79372ea4131efb483; passport_csrf_token_default=fea6749fed6008d79372ea4131efb483; passport_auth_status=6f01e86273e10de44e9a2ea3891f1a25%2C; passport_auth_status_ss=6f01e86273e10de44e9a2ea3891f1a25%2C; sid_guard=8437e2a5e8f43d0bcc46bf26aa479ae5%7C1717844956%7C34560000%7CSun%2C+13-Jul-2025+11%3A09%3A16+GMT; uid_tt=e34ead5d420362c0e3d71761308ff9c74276f6e50a2a774c217bcf2320b46658; uid_tt_ss=e34ead5d420362c0e3d71761308ff9c74276f6e50a2a774c217bcf2320b46658; sid_tt=8437e2a5e8f43d0bcc46bf26aa479ae5; sessionid=8437e2a5e8f43d0bcc46bf26aa479ae5; sessionid_ss=8437e2a5e8f43d0bcc46bf26aa479ae5; sid_ucp_v1=1.0.0-KGI2YTQ3YzBhMjZlNWQ1NGYwZjhmZThlNTdlNzQ3NzgxOGFlMGE0MzEKIAiCiIqEifaqymUQ3PeQswYYnKAVIAww29fSrAY4CEASEAMaA3NnMSIgODQzN2UyYTVlOGY0M2QwYmNjNDZiZjI2YWE0NzlhZTU; ssid_ucp_v1=1.0.0-KGI2YTQ3YzBhMjZlNWQ1NGYwZjhmZThlNTdlNzQ3NzgxOGFlMGE0MzEKIAiCiIqEifaqymUQ3PeQswYYnKAVIAww29fSrAY4CEASEAMaA3NnMSIgODQzN2UyYTVlOGY0M2QwYmNjNDZiZjI2YWE0NzlhZTU; store-idc=alisg; store-country-code=vn; store-country-code-src=uid; _clck=gewwr2%7C2%7Cfmg%7C0%7C1620; _clsk=1auat5k%7C1717845282705%7C5%7C0%7Ct.clarity.ms%2Fcollect; ttwid=1|lzYqbBKYnM2qubxO7orNtAxCXMz3BbnaAMgB-zy4ICY|1717845379|b03fb4bf974d1ec2f5f2cee73c42e6c4d800e57e63795cf2db298385b1742fc5; _uetsid=8d048170258711efb10015e2f330cee7; _uetvid=8d04cee0258711ef8d278993f44c7fbe; odin_tt=f9c81c0021bbd9d87817b4d8a50057bedd96b05b1f1d892df0ac5f9cf669290204dc406ea997bb85e51d6160f3b1ad589361574345e9833327b0ad4f15d5d18f; msToken=yLylj1zd1B0_KRakyX66qTDGIyY6skmEN5KS3Imyn4J8gyKnfOMf7QBg1qaJKOkPzq0xl_OYAU2PvcikPI0-6KOCLxLX_jmrzJOZQ2sUdwCmtaFNk172h79rmfnlqIK0jwe4EA==',
        'Device-Time': '1717845388',
        'Lan': 'vi-VN',
        'Loc': 'va',
        'Origin': 'https://www.capcut.com',
        'Pf': '7',
        'Priority': 'u=1, i',
        'Referer': 'https://www.capcut.com/',
        'Sec-Ch-Ua': '"Google Chrome";v="125", "Chromium";v="125", "Not.A/Brand";v="24"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-site',
        'Sign': '2cd3272c536081caeafe7c07949d023d',
        'Sign-Ver': '1',
        'Tdid': '',
        ...headersss(),
    };
    const data = {
        sdk_version: "86.0.0",
        biz_id: null,
        id: [videoId],
        enter_from: "",
        cc_web_version: 0
    };
    try {
        const response = await axios.post(`https://edit-api-sg.capcut.com/lv/v1/cc_web/replicate/multi_get_templates`, data, { headers });
        const results = {
            id: response.data.data.templates[0].web_id,
            title: response.data.data.templates[0].title,
            short_title: response.data.data.templates[0].short_title,
            duration: response.data.data.templates[0].duration,
            fragment_count: response.data.data.templates[0].fragment_count,
            usage_amount: response.data.data.templates[0].usage_amount,
            play_amount: response.data.data.templates[0].play_amount,
            favorite_count: response.data.data.templates[0].favorite_count,
            like_count: response.data.data.templates[0].like_count,
            comment_count: response.data.data.templates[0].interaction.comment_count,
            create_time: response.data.data.templates[0].create_time,
            author: {
               unique_id: response.data.data.templates[0].author.unique_id,
               name: response.data.data.templates[0].author.name, 
            },
            video_url: response.data.data.templates[0].video_url,
        }
        return results;
    } catch (error) {
        console.error('Error making POST request:', error);
    }
}

module.exports.capcutPost = async function(url){
  const extractId = (url) => {
  const regex = /^https:\/\/www\.capcut\.com\/profile\/([a-zA-Z0-9]+)(\?.*)?$/;
  const match = url.match(regex);
  if (match) {
    return match[1];
  } else {
    return;
  }
};
  const id = extractId(url);
  const headers = {
    'Accept': 'application/json, text/plain, */*',
    'Accept-Encoding': 'gzip, deflate, br, zstd',
    'Accept-Language': 'vi,en;q=0.9',
    'App-Sdk-Version': '48.0.0',
    'Appvr': '5.8.0',
    'Content-Type': 'application/json',
    'Cookie': 'passport_csrf_token=fea6749fed6008d79372ea4131efb483; passport_csrf_token_default=fea6749fed6008d79372ea4131efb483; passport_auth_status=6f01e86273e10de44e9a2ea3891f1a25%2C; passport_auth_status_ss=6f01e86273e10de44e9a2ea3891f1a25%2C; sid_guard=8437e2a5e8f43d0bcc46bf26aa479ae5%7C1717844956%7C34560000%7CSun%2C+13-Jul-2025+11%3A09%3A16+GMT; uid_tt=e34ead5d420362c0e3d71761308ff9c74276f6e50a2a774c217bcf2320b46658; uid_tt_ss=e34ead5d420362c0e3d71761308ff9c74276f6e50a2a774c217bcf2320b46658; sid_tt=8437e2a5e8f43d0bcc46bf26aa479ae5; sessionid=8437e2a5e8f43d0bcc46bf26aa479ae5; sessionid_ss=8437e2a5e8f43d0bcc46bf26aa479ae5; sid_ucp_v1=1.0.0-KGI2YTQ3YzBhMjZlNWQ1NGYwZjhmZThlNTdlNzQ3NzgxOGFlMGE0MzEKIAiCiIqEifaqymUQ3PeQswYYnKAVIAww29fSrAY4CEASEAMaA3NnMSIgODQzN2UyYTVlOGY0M2QwYmNjNDZiZjI2YWE0NzlhZTU; ssid_ucp_v1=1.0.0-KGI2YTQ3YzBhMjZlNWQ1NGYwZjhmZThlNTdlNzQ3NzgxOGFlMGE0MzEKIAiCiIqEifaqymUQ3PeQswYYnKAVIAww29fSrAY4CEASEAMaA3NnMSIgODQzN2UyYTVlOGY0M2QwYmNjNDZiZjI2YWE0NzlhZTU; store-idc=alisg; store-country-code=vn; store-country-code-src=uid; _clck=gewwr2%7C2%7Cfmg%7C0%7C1620; _ga=GA1.1.1507227716.1717848785; _uetsid=8d048170258711efb10015e2f330cee7; _uetvid=8d04cee0258711ef8d278993f44c7fbe; odin_tt=7a1936766b075bcdd15ca040e2d926418c4a911445b5737a4e978efb10e1aed16e9b08365d3a44762209e1adeed01632a30a6b7c37e731b58a092147efb9ba5c; _clsk=1wijwf4%7C1717867543424%7C3%7C0%7Ct.clarity.ms%2Fcollect; msToken=1V8bYwi-_XjwdZIf77jcwuV-13xancdZ5bPQDSCe0nTOgB6cIvyGTWSuMCmAm7cSaDihaE2s50ttXzJbm1d6m22XAJS4dc5KvF1MgCJLpDynxt8C4JHYDuqyhGEpoHOF8AdUbw==; ttwid=1|lzYqbBKYnM2qubxO7orNtAxCXMz3BbnaAMgB-zy4ICY|1717867562|f760193d3026b69a6c6b6dcc54da822c6a83c832451d0d00e50ebe5632b3b8d6; _ga_F9J0QP63RB=GS1.1.1717867508.4.1.1717867563.0.0.0',
    'Device-Time': '1717867567',
    'Lan': 'vi-VN',
    'Loc': 'va',
    'Origin': 'https://www.capcut.com',
    'Pf': '7',
    'Priority': 'u=1, i',
    'Referer': 'https://www.capcut.com/',
    'Sec-Ch-Ua': '"Google Chrome";v="125", "Chromium";v="125", "Not.A/Brand";v="24"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"Windows"',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-site',
    'Sign': '3eb8d0cc0725a849d395c56b1d5ae44b',
    'Sign-Ver': '1',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
  };
  const json = {
   "cursor": "0",
   "count": 20,
   "uid": "",
   "public_id": id,
   "status_list": [],
   "template_type_list": [1]
};
  try {
    const response = await axios.post(`https://edit-api-sg.capcut.com/lv/v1/cc_web/homepage/profile/templates`, json, { headers });
    const medias = [];
    const data = response.data.data.templates;
data.map(item => {
  const media = {
    id: item.web_id,
    title: item.title,
    short_title: item.short_title,
    author: {
      unique_id: item.author.unique_id,
      name: item.author.name
    },
    duration: item.duration,
    like_count: item.like_count,
    play_amount: item.play_amount,
    usage_amount: item.usage_amount,
    fragment_count: item.fragment_count,
    comment_count: item.interaction.comment_count,
    create_time: item.create_time,
    video_url: item.video_url,
  };
  medias.push(media);
});
    return medias;
  } catch (error) {
    console.error('Error:', error);
  }
};

module.exports.zaloai = async function(text) {
  try {
    const config = {
      method: 'post',
      url: 'https://zalo.ai/api/demo/v1/tts/synthesize',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Accept-Encoding': 'gzip, deflate, br, zstd',
        'Accept-Language': 'vi,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': 'zai_did=8k9uAj3FNiTevcSSryzXoYYo6Kd3nsN9BB8QJ3Su; __zi=2000.SSZzejyD0jydXQcYsa00d3xBfxgO71AM8Ddbg8uFMCbcs-panWzOpMNSvE2D2bRDAjpgw8aFNC0qDG.1; _zlang=vn; _gid=GA1.2.236391597.1717932396; _gat_gtag_UA_158812682_2=1; _ga_TMJX5TWN5E=GS1.1.1717932395.1.1.1717932409.46.0.0; _ga=GA1.2.10508686.1717932396',
        'Origin': 'https://zalo.ai',
        'Pragma': 'no-cache',
        'Referer': 'https://zalo.ai/products/text-to-audio-converter',
        'Sec-Ch-Ua': '"Google Chrome";v="125", "Chromium";v="125", "Not.A/Brand";v="24"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
      },
      data: qs.stringify({
      input: encodeURIComponent(text),
      speaker_id: 1,
      speed: 1,
      dict_id: 0,
      quality: 0
      })
   };
   const response = await axios(config);
   return response.data.data.url;
  } catch (error) {
    console.error('Error:', error);
  }
}

module.exports.facebook = async (url) => {
    const config = require(process.cwd()+"/system/api/config.json");
    const handleError = (error) => {
        console.error(error);
        return { message: error.message };
    };
    const getData = async (url) => {
        try {
            const getUser = (await axios.get(`${config.api}/api/facebook/getid?url=${url}`)).data;
            let graphUrl;
            switch(getUser.type) {
            	case 'stories':
                 graphUrl = `${config.api}/api/facebook/stories?url=${getUser.url}`;
                break;
                case 'post':
                case 'watch':
                    graphUrl = `https://graph.facebook.com/v20.0/${getUser.username}_${getUser.id}?fields=from,message,shares,reactions.summary(true),comments.summary(true),attachments&access_token=${config.token}`;
                    break;
                case 'photo':
                    graphUrl = `https://graph.facebook.com/v20.0/${getUser.id}?fields=from,source,reactions.summary(total_count),comments.summary(total_count)&access_token=${config.token}`;
                    break;
                case 'story':
                    graphUrl = `https://graph.facebook.com/v20.0/${getUser.username}_${getUser.id}?fields=from,message,shares,reactions.summary(total_count),comments.summary(total_count),attachments&access_token=${config.token}`;
                    break;
                case 'reel':
                    graphUrl = `https://graph.facebook.com/v20.0/${getUser.id}?fields=from,description,source,reactions.summary(total_count),comments.summary(total_count)&access_token=${config.token}`;
                    break;
                default:
                    throw new Error('The server has encountered an error');
            }
            const response = await axios.get(graphUrl);
            if (response.data) {
                let data;
                switch(getUser.type) {
                	case 'stories':
                    data = response.data;
                    break;
                    case 'watch':
                    case 'post':
                        data = {
                   message: response.data.message || "",                                                     author: {
  name: response.data.from.name,
         id: response.data.from.id
           },
                            statistics: {
                                like: response.data.reactions ? response.data.reactions.summary.total_count : 0,
                                comment: response.data.comments ? response.data.comments.summary.total_count : 0,
                                share: response.data.shares ? response.data.shares.count : 0
                            },
                            attachments: response.data.attachments ? response.data.attachments.data.reduce((acc, attachment) => {
                                if (attachment.subattachments && attachment.subattachments.data.length > 0) {
                                    attachment.subattachments.data.forEach((data) => {
                                        acc.push({
                                            type: data.type,
                                            url: data.media.image.src
                                        });
                                    });
                                }
                                if (attachment.type === 'photo' || attachment.type === 'profile_media') {
                                    acc.push({
                                        type: "photo",
                                        url: attachment.media.image.src
                                    });
                                }
                                if (attachment.type === 'video_inline' || attachment.type === 'video_autoplay') {
                                    acc.push({
                                        type: "video",
                                        url: attachment.media.source
                                    });
                                }
                                return acc;
                            }, []) : []
                        };
                        break;
                    case 'photo':
                        data = {
                  message: response.data.message || "",                                                     author: {
  name: response.data.from.name,
         id: response.data.from.id
           },
                            statistics: {
                                like: response.data.reactions ? response.data.reactions.summary.total_count : 0,
                                comment: response.data.comments ? response.data.comments.summary.total_count : 0,
                                share: ""
                            },
                            attachments: response.data.source ? [{
                                type: "photo",
                                url: response.data.source
                            }] : []
                        };
                        break;
                    case 'story':
                        data = {
               message: response.data.message || "",                                                         author: {
  name: response.data.from.name,
         id: response.data.from.id
           },
                            statistics: {
                                like: response.data.reactions ? response.data.reactions.summary.total_count : 0,
                                comment: response.data.comments ? response.data.comments.summary.total_count : 0,
                                share: response.data.shares ? response.data.shares.count : 0
                            },
                            attachments: response.data.attachments ? response.data.attachments.data.reduce((acc, attachment) => {
                                if (attachment.subattachments && attachment.subattachments.data.length > 0) {
                                    attachment.subattachments.data.forEach((data) => {
                                        acc.push({
                                            type: data.type,
                                            url: data.media.image.src
                                        });
                                    });
                                }
                                if (attachment.type === 'photo' || attachment.type === 'profile_media') {
                                    acc.push({
                                        type: "photo",
                                        url: attachment.media.image.src
                                    });
                                }
                   if (attachment.type === 'video_inline' || attachment.type === 'video_autoplay') {
                                    acc.push({
                                        type: "video",
                                        url: attachment.media.source
                                    });
                                }
                                return acc;
                            }, []) : []
                        };
                        break;
                    case 'reel':
                        data = {
       message: response.data.message || "",                                                        author: {
  name: response.data.from.name,
         id: response.data.from.id
           },
                            statistics: {
                                like: response.data.reactions ? response.data.reactions.summary.total_count : 0,
                                comment: response.data.comments ? response.data.comments.summary.total_count : 0,
                                share: ""
                            },
                            attachments: response.data.source ? [{
                                type: "video",
                                url: response.data.source
                            }] : []
                        };
                        break;
                }
                return data;
            }
        } catch (error) {
            return handleError(error);
        }
    };
if (url.includes("facebook.com") || url.includes("fb.watch")) {
    return await getData(url);
} else {
    return { message: "URL không hợp lệ!", url: url };
}
};

module.exports.threadsdlv3 = async function(url) {
  function generateRandomUserAgent() {
  const p = [
    'Windows NT 10.0; Win64; x64',
    'Windows NT 10.0; WOW64',
    'Macintosh; Intel Mac OS X 10_15_7',
    'Linux x86_64',
    'iPad; CPU OS 14_6 like Mac OS X',
    'iPhone; CPU iPhone OS 14_6 like Mac OS X'
  ];
  const b = [
    'Chrome/91.0.4472.114',
    'Firefox/89.0',
    'Safari/537.36',
    'Edge/91.0.864.48'
  ];
  const rp = p[Math.floor(Math.random() * p.length)];
  const rb = b[Math.floor(Math.random() * b.length)];
  return `Mozilla/5.0 (${rp}) AppleWebKit/537.36 (KHTML, like Gecko) ${rb}`;
}
const rUA = generateRandomUserAgent();
  function formatNumber(number) {
    if (isNaN(number)) {
        return null;
      }
       return number.toLocaleString('de-DE');
    }
    async function getId(short_code) {
      const headers = {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br, zstd',
        'Accept-Language': 'vi,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Cookie': 'ezoictest=stable; __gads=ID=3529941db703624e:T=1718249032:RT=1718249032:S=ALNI_MYhbWT6PnsdTI5UfIiusNOgHsUThQ; __gpi=UID=00000e491a1005dc:T=1718249032:RT=1718249032:S=ALNI_Mak42Hxh6mDUuMSiA59DlTn4iGgHA; __eoi=ID=57b63eea87d1a12d:T=1718249032:RT=1718249032:S=AA-AfjaZJnO8eLp_S2qukKKqkW0e; ezoab_414918=mod112; ezoadgid_414918=-1; active_template::414918=pub_site.1718249052; ezopvc_414918=1; ezosuibasgeneris-1=cb3f53a2-a4f0-40f1-48a0-147b968476b1; lp_414918=https://twitterpicker.com/; ezovuuidtime_414918=1718249053; ezovuuid_414918=2515c126-80f3-4bd9-66ea-650ca0cedd8c; ezoref_414918=; cf_clearance=kC9Ll1_RQvsPpH2q9ceKsHwcG7Vh8xYOnV9pX.yy2Xg-1718249057-1.0.1.1-IMLGgNAyZHAwYGSza8j8IT8UueQ_RqhkGZ4cMWg1GEYp1VaR3yFMDxaEGiUBG_LcVFyoxro96IMp.CXZTbQY1A; _sharedid=7d7d7c2b-d7ee-4569-b852-083e9f0d685f; _sharedid_cst=zix7LPQsHA%3D%3D; _au_1d=AU1D-0100-001718249069-PKT3KJ75-9RA8; _ga=GA1.2.1125642022.1718249057; _gid=GA1.2.1817739483.1718249071; cto_bundle=_DE2Q19JT3QxWnRXRlZUSkZySlB0YnElMkZCdk82S3AwM1lzbmt2NmpxTWVhS256UjlKdkg1QnhuUW5PMHdLeHNwakh2QjZoSEoxaVNZVldOdkwzYlp1RzFaZldiWkM2RDBKM2VEN08zYnJKdGlEVFlFVWd0JTJGRDRVVCUyQmhxOHpRSHp2TmFsSm95bERmd1lJb0lRU1JsUXY0azhyJTJCJTJCajJDeGlIa0Q2bXVoYVdRenV6c3lZJTNE; __qca=P0-1848793365-1718249101609; _ga_MJGFWV9VDR=GS1.1.1718249057.1.1.1718249146.60.0.0',
        'Pragma': 'no-cache',
        'Sec-Ch-Ua': '"Google Chrome";v="125", "Chromium";v="125", "Not.A/Brand";v="24"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
    };
        try {
            const response = await axios.get(`https://api.twitterpicker.com/threads/post/media?id=${short_code}`, { headers });
            return response.data.meta.thread_id;
        } catch (error) {
            console.error('Error getting thread ID:', error);
            throw error;
        }
    }
    try {
        const id = await getId(url);
        const data = new URLSearchParams({
            'av': '17841452312209625',
            '__user': '0',
            '__a': '1',
            '__req': 'f',
            '__hs': '19884.HYP:barcelona_web_pkg.2.1..0.1',
            'dpr': '1',
            '__ccg': 'UNKNOWN',
            '__rev': '1014090780',
            '__s': 'tu5y4g:qv29ay:1j753l',
            '__hsi': '7378849782922290444',
            '__dyn': '7xeUmwlEnwn8K2Wmh0cm5U4e0yoW3q32360CEbo1nEhw2nVE4W0om782Cw8G11wBz81s8hwGwQw9m1YwBgao6C0Mo2swlo5qfK0EUjwGzE2ZwNwKwHw8Xxm16wa-7U88138bodEGdwtU2ewbS1LwTwKG0hq1Iwqo9EpwUwiU27wHxW17y9UjgaAazU',
            '__csr': 'gD2dMxEQTRH99lqkLhSBKXZIJrhWQHl7Aggh7J7Cw06vjg0itqVykNYO3OwMy8lg5a516OwICz10K2p96DgGuAlToig2Z8ewCgkxi4aUjxq3HFyUjxgk1VP0995tBw5aDDmsk05UUbVm',
            '__comet_req': '29',
            'fb_dtsg': 'NAcOpte7e-hiQF-3TkdxMLB5SNo5Qp8PUvrwEBeSb3Aij3E-_a8e1_w:17864642926059691:1717864156',
            'jazoest': '26144',
            'lsd': 'PR_TndWYemhUqc-ntLeiAL',
            '__spin_r': '1014090780',
            '__spin_b': 'trunk',
            '__spin_t': '1718022344',
            '__jssesw': '1',
            'fb_api_caller_class': 'RelayModern',
            'fb_api_req_friendly_name': 'BarcelonaPostPageQuery',
            'variables': JSON.stringify({
                "postID": id,
                "__relay_internal__pv__BarcelonaIsLoggedInrelayprovider": true,
                "__relay_internal__pv__BarcelonaShouldShowFediverseM1Featuresrelayprovider": false,
                "__relay_internal__pv__BarcelonaIsInlineReelsEnabledrelayprovider": false,
                "__relay_internal__pv__BarcelonaUseCometVideoPlaybackEnginerelayprovider": false,
                "__relay_internal__pv__BarcelonaOptionalCookiesEnabledrelayprovider": false,
                "__relay_internal__pv__BarcelonaIsTextFragmentsEnabledForPostCaptionsrelayprovider": true,
                "__relay_internal__pv__BarcelonaShouldShowFediverseM075Featuresrelayprovider": false
            }),
            'server_timestamps': 'true',
            'doc_id': '7632463183513179'
        });
        const response = await axios.post('https://www.threads.net/api/graphql', data, {
            headers: {
                'authority': 'www.threads.net',
                'Accept': '*/*',
                'Accept-Language': 'vi,en;q=0.9',
                'Cache-Control': 'no-cache',
                'Content-Type': 'application/x-www-form-urlencoded',
                'Cookie': 'mid=ZoUylgALAAFR0ssS0w7sxXRd9nt0; ig_did=B2819ECE-3FE8-457D-B3EA-0CE9426A97F3; csrftoken=apKIz6zLedl5St1RgTXrrCcBHFZQTcsi; ds_user_id=67570554512; sessionid=67570554512%3A2J45YsdwN7aEUW%3A27%3AAYed8_yMkLAPu2OWEyTA7J7BKJb670JY-yhQcUUklg; ps_n=1; ps_l=1; useragent=TW96aWxsYS81LjAgKFdpbmRvd3MgTlQgMTAuMDsgV2luNjQ7IHg2NCkgQXBwbGVXZWJLaXQvNTM3LjM2IChLSFRNTCwgbGlrZSBHZWNrbykgQ2hyb21lLzEyNS4wLjAuMCBTYWZhcmkvNTM3LjM2; _uafec=Mozilla%2F5.0%20(Windows%20NT%2010.0%3B%20Win64%3B%20x64)%20AppleWebKit%2F537.36%20(KHTML%2C%20like%20Gecko)%20Chrome%2F125.0.0.0%20Safari%2F537.36;',
                'Origin': 'https://www.threads.net',
                'Pragma': 'no-cache',
                'Priority': 'u=1, i',
                'Referer': 'https://www.threads.net/',
                'Sec-Ch-Prefers-Color-Scheme': 'light',
                'Sec-Ch-Ua': '"Google Chrome";v="125", "Chromium";v="125", "Not.A/Brand";v="24"',
                'Sec-Ch-Ua-Full-Version-List': '"Google Chrome";v="125.0.6422.77", "Chromium";v="125.0.6422.77", "Not.A/Brand";v="24.0.0.0"',
                'Sec-Ch-Ua-Mobile': '?0',
                'Sec-Ch-Ua-Model': '""',
                'Sec-Ch-Ua-Platform': '"Windows"',
                'Sec-Ch-Ua-Platform-Version': '"12.0.0"',
                'Sec-Fetch-Dest': 'empty',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Site': 'same-origin',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
                'X-Asbd-Id': '129477',
                'X-Csrftoken': '4vTDHYS2XKUbHERwVIuZ7h7P4uIkTFiU',
                'X-Fb-Friendly-Name': 'BarcelonaPostPageQuery',
                'X-Fb-Lsd': 'PR_TndWYemhUqc-ntLeiAL',
                'X-Ig-App-Id': '238260118697367'
            }
        });
        const dataResponse = response.data.data.data.edges[0].node.thread_items[0].post;
        const attachments = [];
        if (dataResponse.video_versions && dataResponse.video_versions.length > 0) {
            attachments.push({
                type: 'Video',
                url: dataResponse.video_versions[0].url
            });
        }
        if (dataResponse.carousel_media && dataResponse.carousel_media.length > 0) {
            const photos = [];
            const videos = [];
            dataResponse.carousel_media.forEach(item => {
                if (item.image_versions2 && item.image_versions2.candidates && item.image_versions2.candidates.length > 0) {
                    photos.push({
                        type: 'Photo',
                        url: item.image_versions2.candidates[0].url
                    });
                }
                if (item.video_versions && item.video_versions.length > 0) {
                    videos.push({
                        type: 'Video',
                        url: item.video_versions[0].url
                    });
                }
            });
            attachments.push(...photos, ...videos);
        }
        if (dataResponse.audio && dataResponse.audio.audio_src) {
          attachments.push({
              type: 'Audio',
              url: dataResponse.audio.audio_src
          });
        }
        const results = {
            id: dataResponse.pk,
            message: dataResponse.caption.text || "Không có tiêu đề",
            like_count: formatNumber(dataResponse.like_count) || 0,
            reply_count: formatNumber(dataResponse.text_post_app_info.direct_reply_count) || 0,
            repost_count: formatNumber(dataResponse.text_post_app_info.repost_count) || 0,
            quote_count: formatNumber(dataResponse.text_post_app_info.quote_count) || 0,
            author: dataResponse.user.username,
            short_code: dataResponse.code,
            taken_at: dataResponse.taken_at,
            attachments
        };
        return response.data;
    } catch (error) {
        console.error('Error processing thread:', error);
        throw error;
    }
}

module.exports.spotifydlv3 = async function(link) {
    const client_id = 'b9d2557a2dd64105a37f413fa5ffcda4';
    const client_secret = '41bdf804974e4e70bfa0515bb3097fbb';
    async function convert(url) {
      try {
        const response = await axios.post('https://spotmate.online/convert', { urls: url }, { headers: {
          'Accept': '*/*',
            'Accept-Encoding': 'gzip, deflate, br, zstd',
            'Accept-Language': 'vi,en-US;q=0.9,en;q=0.8,fr-FR;q=0.7,fr;q=0.6',
            'Content-Type': 'application/json',
            'Cookie': '_ga=GA1.1.257475168.1718135496; _ga_6LS2RMW0TN=GS1.1.1718135496.1.0.1718135502.0.0.0; XSRF-TOKEN=eyJpdiI6Ijh4bE56VUxCLytxZ3RERDBGN0pTR1E9PSIsInZhbHVlIjoiUkliNk5LVm4zeVVWLytJcXg3VnlLa1BvZ0ZrVTE1NjBDaDFQbzlEUHBLWnZUVnBqdFdMSzJOYUpiaVRGYWhoTi9yOWZaMjg4RXN3RWRMMUxXaGczZlg5Z3V4d2FIa00zUnJlNnQrVWdiR2lyQXRoV3NMQTB1SXhnN2gxMVRHRGMiLCJtYWMiOiJkOGVkZmY5MmIzNWE1NzFiMTE5YTgzNGJkODAxNjViZDIzZmI0ZmY4NzMwMzU4ZjExMDcyNzE2MDgxMzNmZmY3IiwidGFnIjoiIn0%3D; spotmateonline_session=eyJpdiI6ImVzWG5IMkhYaC9pancxbHE0cTdOSlE9PSIsInZhbHVlIjoiYWdWYWpkcW41c0xnUGhQQmlkc011Z0tHWUhiQlRKOWFsRGlKZmtvSzF1cThOU0hDRG1pQ2VqaEtOTG50QUlQejlyNTgxejJpbGFHMGh2UVVWYnJLcnE0NmFWaml3Mi9kalRYMFdZSXdLUytOTkE2dTJOSDczdTc5bzM3WUcydksiLCJtYWMiOiIwZDVhMmY0ZWVjMzU0OGZmNDFkYWU2MDMxZmRkZmRiOTFmMjllYTM1MjM3ZTM4NjJkYjdiOGE5NzBlYTE4YmM4IiwidGFnIjoiIn0%3D',
            'Origin': 'https://spotmate.online',
            'Referer': 'https://spotmate.online/',
            'Sec-Ch-Ua': '"Google Chrome";v="123", "Not:A-Brand";v="8", "Chromium";v="123"',
            'Sec-Ch-Ua-Mobile': '?0',
            'Sec-Ch-Ua-Platform': '"Windows"',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-origin',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
            'X-Csrf-Token': '1n1ilEbN0B3ym7IB8iRzBhaAjIOjodBpXCqMy4o5'
        } });
        return response.data.url;
      } catch (error) {
        console.error('Error:', error);
      }
    }
    async function getAccessToken() {
        const tokenUrl = 'https://accounts.spotify.com/api/token';
        const data = qs.stringify({ grant_type: 'client_credentials' });
        const response = await axios.post(tokenUrl, data, {
            headers: {
                'Authorization': 'Basic ' + Buffer.from(client_id + ':' + client_secret).toString('base64'),
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        return response.data.access_token;
    }
    async function getTrack(trackId) {
        const accessToken = await getAccessToken();
        const trackUrl = `https://api.spotify.com/v1/tracks/${trackId}`;
        const response = await axios.get(trackUrl, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        return response.data;
    }
    try {
      const extractId = (url) => {
      const regex = /https:\/\/open\.spotify\.com\/track\/([a-zA-Z0-9]+)(\?.*)?/;
      const match = url.match(regex);
      if (match && match[1]) {
        return match[1];
        } else {
        return null;
          }
      }
      const trackId = extractId(link);
      const trackdata = await getTrack(trackId);
      const audio = await convert(link);
      let attachments = [];
      attachments.push({
          type: "Audio",
          url: audio
      });
      const results = {
        id: trackdata.id,
        title: trackdata.name,
        popularity: trackdata.popularity,
        duration_ms: trackdata.duration_ms,
        artists: trackdata.album.artists[0].name,
        album: trackdata.album.name,
        release_date: trackdata.album.release_date,
        attachments
      };
      return results;
    } catch (error) {
        console.error('Lỗi:', error.response ? error.response.data : error.message);
    }
}

module.exports.bilidl = async function(url) {
  const data = {
  fingerprint: {
    id: "PITgStO6qNzFmlEjEef6",
    name: "public.tools.downloader-pubic",
    locale: "vi",
    path: "vi/bilibili-downloader",
    method: "GET",
    v: "acj"
  },
  serverMemo: {
    children: [],
    errors: [],
    htmlHash: "2e4bb9d2",
    data: {
      render_mode: false,
      link: null,
      stream_vid: false,
      stream_thumb: true,
      data: [],
      status: null,
      message: null
    },
    dataMeta: [],
    checksum: "e99cecdecb96dd4b3accbce429170d52a5fecffa8ebe71bbd172f069c67686b7"
  },
  updates: [
    {
      type: "syncInput",
      payload: {
        id: "bo7p",
        name: "link",
        value: url
      }
    },
    {
      type: "callMethod",
      payload: {
        id: "iwb",
        method: "onDownload",
        params: []
      }
    }
  ]
};
const config = {
  headers: {
    'Accept': 'text/html, application/xhtml+xml',
    'Accept-Encoding': 'gzip, deflate, br, zstd',
    'Accept-Language': 'vi,en;q=0.9',
    'Cache-Control': 'no-cache',
    'Content-Type': 'application/json',
    'Cookie': 'XSRF-TOKEN=eyJpdiI6IlJ4OG1uRHhzNFVzQmNjQXE0Mi9TeHc9PSIsInZhbHVlIjoibHZFS1BwT2JOcVMwa3NTVFl4K2JuS202T0wwR0xEdUNwUm50dmRKT1hwUE1BeERsUHl2clREZitoWkdOL0VhRFlDblZGejE1UmFFZVg5TFlzbHhYbHF3bzVlbERUQktSdWtGaG1zRlJaYVhjTmdTREpTZXN5L2tJY25pWVI0QnoiLCJtYWMiOiJkMjhiMDI0MDc4NjE1MjYzOGU2MTdhYzhkZTM5YzA5ZGNkY2M2MGQ0ZTI5ZjhhODIwZmI1MGNmOWUwYWFmZTg4IiwidGFnIjoiIn0%3D; bravedown_session=eyJpdiI6IkxJc0dENW9Dd2pHNnB5dnpyeEZRWUE9PSIsInZhbHVlIjoidXRkbW5yYzNrV3VSMjJBT2lSeHp4N0cxRTBiK0RvYzJ3RjRFanBubWVyOUhhdzNTa0t3QzA5bnVJckJkSmlBRnF1bVgwdmJpN3l4Qk1OMjBJdjZad0JQdTA2TmRVTDFieFNyWFN6bmFHUHhaZHRIQVA1S0xpbHdpYWtwYUl0eXQiLCJtYWMiOiI5MzJlOGVjM2Y3NjgxMDNkZWU2Y2VhNmY5NzcyMTg4NjhhYmQwMWRmYWNiOTJhNzViNGU1OTk5MzEwNDEzYWE3IiwidGFnIjoiIn0%3D; cf_clearance=VQ8k__VIYJDhqYpHR9MEslJRKUvJxZcRYYPv1od.CM0-1718175382-1.0.1.1-vtdVWbtxuFA5lQl9wm63N2uU.Ujd2Ag29_.j0m0ucBbFMvubJ..4OhV9p228_5ELTvwFYecJUwfHjHy_Cb3yEw; _ga=GA1.1.1263529158.1718175383; _ga_J346D2130P=GS1.1.1718175383.1.0.1718175392.0.0.0',
    'Origin': 'https://bravedown.com',
    'Pragma': 'no-cache',
    'Priority': 'u=1, i',
    'Referer': 'https://bravedown.com/vi/bilibili-downloader',
    'Sec-Ch-Ua': '"Google Chrome";v="125", "Chromium";v="125", "Not.A/Brand";v="24"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"Windows"',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-origin',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    'X-Csrf-Token': 'TkHFdoPbsvdfAjD1ffHONL1ec0mGfMeFLd4p6Imq',
    'X-Livewire': 'true'
  }
};
  try {
    const response = await axios.post('https://bravedown.com/livewire/message/public.tools.downloader-pubic', data, config);
    return response.data.serverMemo.data.data;
  } catch (error) {
    console.error(error);
  }
}

module.exports.blackbox = async function(text) {
  const payload = {
  "messages": [
    {
      "id": "9Bgn4kG",
      "content": text,
      "role": "user"
    }
  ],
  "id": "9Bgn4kG",
  "previewToken": null,
  "userId": "b40ab573-3748-451a-866c-7a8d02a67c4a",
  "codeModelMode": true,
  "agentMode": {},
  "trendingAgentMode": {},
  "isMicMode": false,
  "isChromeExt": false,
  "githubToken": null,
  "clickedAnswer2": false,
  "clickedAnswer3": false,
  "visitFromDelta": null
};
const headers = {
  'Accept': '*/*',
  'Accept-Encoding': 'gzip, deflate, br, zstd',
  'Accept-Language': 'vi,en-US;q=0.9,en;q=0.8,fr-FR;q=0.7,fr;q=0.6',
  'Content-Type': 'application/json',
  'Cookie': 'sessionId=0e2c5802-3fa8-4a53-a2c2-a06431d0f2d9; _gcl_au=1.1.1018995135.1718283653; __Host-next-auth.csrf-token=101abcaa6d94a355ccd585dfd6d6ef3fa811d3ca7bb218eadcd43461d69a59b9%7C9f753505545b57ca23cd795d92856db8fe48df6a3f3fdf9abe35586c1f40790e; __Secure-next-auth.callback-url=https%3A%2F%2Fwww.blackbox.ai%2F; __Secure-next-auth.session-token=eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIn0..q1KESR_U3OaKX9uS.dAwSb3ZKnLjHeedV1dYrhBDJ47Ztdx_4khiiLj33uA6H0R04qJCoObhfpv2_IkBMrV8d4QYCqx91HRnt4MKibTVGCl3soIkq9JmZ13x8AanrK_v09KpsVOUe99lZU83wMSzkX109leG_5bYuvBlBM5wSPqUEwzpt_YpKv79gRIkVRznhjFoPJzSuXvVgTg4u9edA5woU_X09M1VhP8iKc8inOMz26DM7R1x_QSASffV8iVOmeRvA0harTlEaIMOXs6MTKefrXBioINn5I0dPTVEdI5yeCyWAY21ofCILNWk_R0WGQidwOb7p5czDwzPqmlErQJ-pCdgAcb83hImWsl5a6rz9eVAz-KjUSH9w2AS6zAKshneyFxTISKoYlRS_3VvE5SZ-EDr8TLXdOOrAjQO_Wv-XPmY_7BqJHZCyRCfhckWTsY4ty8C9X5At4sF3zatrTCrNp5sUd4IGwUHih6qBaK77zCu-my5uz8yBy8uQtVjMiq5HB5Q.8gst4tbIi2lMNKZWAH0mbw',
  'Origin': 'https://www.blackbox.ai',
  'Referer': 'https://www.blackbox.ai/',
  'Sec-Ch-Ua': '"Google Chrome";v="123", "Not:A-Brand";v="8", "Chromium";v="123"',
  'Sec-Ch-Ua-Mobile': '?0',
  'Sec-Ch-Ua-Platform': '"Windows"',
  'Sec-Fetch-Dest': 'empty',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Site': 'same-origin',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
 };
    const res = await axios.post('https://www.blackbox.ai/api/chat', payload, { headers: headers });
    const extract = res.data.replace(/\$@\$.+?\$@\$/g, '');
    const data = extract.trim();
    return data;
};
