const axios = require("axios");
const qs = require('qs');

async function downloadv1(url) {
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
        k: data.links.mp4["134"]["k"],
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

module.exports = {
    downloadv1
};