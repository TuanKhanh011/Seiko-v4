const axios = require('axios');
const cheerio = require('cheerio');
const qs = require('qs');

async function search(keywords, limit = 10) {
  try {
    const response = await axios.get(`https://m.tiktok.com/api/search/general/full/?keyword=${encodeURI(keywords)}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:99.0) Gecko/20100101 Firefox/99.0",
        "cookie": '_ttp=2UYKQrM4SmZZenItvveYVoKcRbi; tt_chain_token=xJitPcTGnRtRoIQbkG1Rpg==; tiktok_webapp_theme=light; uid_tt=718bd1d8fc4d8a6eaf7fe1bd59d2fedb46158b25e382d5e9c0277697edac7c23; uid_tt_ss=718bd1d8fc4d8a6eaf7fe1bd59d2fedb46158b25e382d5e9c0277697edac7c23; sid_tt=5c175b76c99f4e3b07ab3ca7c0c1e151; sessionid=5c175b76c99f4e3b07ab3ca7c0c1e151; sessionid_ss=5c175b76c99f4e3b07ab3ca7c0c1e151; store-idc=alisg; store-country-code=vn; store-country-code-src=uid; tt-target-idc=alisg; tt-target-idc-sign=IZqkoGplb7W_eUgHBchKFio2X3juz96L66dacqHNIFz54B9LeKsejGtoGBSO6USJ8EByFEkqwevpeEZH0fqHZa99vQaFtdbVk8gkBN8dM0yJIWObx4NM2v5Cser9N5bP1ZLKMBFnVLUVPaeVO1cxRJsq3b4UGBPJg0AKWufql0hV6YztnBXYDZ7GcFxpS9JfmnRxkQL2DcyQaIz0jIYgZEvzrOuOzYhf0-7M0AOhhj5URcnGOt7m8T0BQLqIcXaT80jNjk1RoRQ_2l8Nm_l0N_V1428nyjt37mu83zFDdYsx5Kt0n77JbpNbfWhHxY6pFSVt-Dcn5ElzRfLPwrp8Fj7PQsuWd3rtSXv-VR4Gd5g2zOiu5i9xJwOXLoWaEnuT_i9jsA5PkZ1bdt561DpoWBnJyPqz9gl2VBmcmIq0OeefZIVnxUvVVaP5TlUvrbTB6xLHJ37hrNd1vh8I63Ux7EwTIplI5zyA2seFtUcq8OF5EiebFe6wlmy7qQd2_sVr; tt_csrf_token=DFfQHzT9-qG_2NUUsBZ5gtUV7aBvzodS9Ydc; ak_bmsc=9CDD4A265744E29B6FA10260420F838F~000000000000000000000000000000~YAAQF+ercU09wuCOAQAAbo2pRxd2vCSmrBA1B3BNtavmHKdqChmVpaxVoLvENxwnjbbBYp1e4lkavk1Rf7Jojl9SsYCS3mnTthMDsQKZQAyRz++JjSMMeHAd1M8j0443AMfQA5sICVZQ82VA4xmxvN1B3y0ZbKWcV1g/AkqBHHsryFt+JUJSHtJOYLcjp2Ric81qBS9e1YwUF3ux1aUNXkre6+DlysonlwvOQrgtscMz4tLI2ncqNq5AKPIGMOGbSinSMACkeyGedU15oYm9jM78KEZvctPfVqb/gmWQJBnbShm/BSvI2QalR2N4FOkbeg5FynyD5XYxbOY38rZMDl5Dmt3Jll/0ZLayQdqwsmFa8+G3FcnnOiP1pty2B6L261+1O90zN1mI; sid_guard=5c175b76c99f4e3b07ab3ca7c0c1e151%7C1714894249%7C15552000%7CFri%2C+01-Nov-2024+07%3A30%3A49+GMT; sid_ucp_v1=1.0.0-KDBjNTY5OTcxZTJmZWVmYjUzY2E5MzlmZjc3NjE1ZTg5YTQ1MTM2ZDEKHwiBiLaC6qSB32UQqevcsQYYswsgDDDcjfitBjgIQBIQAxoDc2cxIiA1YzE3NWI3NmM5OWY0ZTNiMDdhYjNjYTdjMGMxZTE1MQ; ssid_ucp_v1=1.0.0-KDBjNTY5OTcxZTJmZWVmYjUzY2E5MzlmZjc3NjE1ZTg5YTQ1MTM2ZDEKHwiBiLaC6qSB32UQqevcsQYYswsgDDDcjfitBjgIQBIQAxoDc2cxIiA1YzE3NWI3NmM5OWY0ZTNiMDdhYjNjYTdjMGMxZTE1MQ; bm_sv=D79A28FB79A2AA2D4375DD11DD4C18D1~YAAQF+ercVc9wuCOAQAAa6epRxeAqWI6x+0yefULIDep3YqsjNwgfBm2kWiNqwij6CQ5KQm7TDvDUK9/SpQc24JkqUO/0YFeMTd/wcfNrTVDVHOXPUZAVG85ZNcb/3OEYkrZ3Kq1dC0Q3mzSl4SAhYSHayS9ST01XN9WPmYYLlV75VOjnmFTUOLXy21blJ9joWJJ7itmCwegH/k/akeSferkLz7/VP1IQzB6lekufKy1dJYLnmmIARnF/g6HSTs+~1; ttwid=1%7C67Ck6lGLYwQNpr4_BgqfE_qwgXKSWvwhSGTP9p93qTI%7C1714894254%7C63ebeeeb770ac8e61e9daedfde5fcc6382d36b346acf65716f81e8b0b724918d; odin_tt=f2f120d733694b449f2a768f887bba1b92d0bb81b7c6bda293bfa5b76ac470c5a292c50e6fb2fdedf1ea303fae9285c4bda91c95c028b42159712ca8eebbcead6a0d50805b5897ee2b1bc01bf68ed67c; perf_feed_cache={%22expireTimestamp%22:1715065200000%2C%22itemIds%22:[%227363561802946514177%22%2C%227335701134037830944%22]}; msToken=wa0a75jJLYjR8eO8Lss9t-xUeKu5X5ahcqxparKNrQ0kng22XiqVAXzvYPpdcnErVQjXglCNtlGObqExtO_GeWV3fGSPJvDGM60GggT2RdhbhNXPRqyQKFgW1PVZ4KbIRXCLsw==; msToken=8qaceELHDaBpHf50xECAaCnmT8ajkcXCHLPYI9Rj9tHM2uTj1b3sjEsP1W_ByS-AOQDPD0gwCELp6vPonrmgsUg6Gb5PGbWU_xbUd428yGlidDHpV7Vm8eMynrRDJf9HQXAquw==; useragent=TW96aWxsYS81LjAgKExpbnV4OyBBbmRyb2lkIDEwOyBLKSBBcHBsZVdlYktpdC81MzcuMzYgKEtIVE1MLCBsaWtlIEdlY2tvKSBDaHJvbWUvMTIwLjAuMC4wIE1vYmlsZSBTYWZhcmkvNTM3LjM2; _uafec=Mozilla%2F5.0%20(Linux%3B%20Android%2010%3B%20K)%20AppleWebKit%2F537.36%20(KHTML%2C%20like%20Gecko)%20Chrome%2F120.0.0.0%20Mobile%20Safari%2F537.36;',
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

async function searchUser(username, page) {
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

async function infov2(user) {
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

async function downloadv1(url) {
    try {
        const { data } = await axios.post('https://ttsave.app/download', qs.stringify({
            query: url,
            language_id: "1"
        }), {
            headers: {
                'authority': 'ttsave.app',
                'method': 'POST',
                'path': '/download',
                'scheme': 'https',
                'accept': 'application/json, text/plain, */*',
                'accept-encoding': 'gzip, deflate, br, zstd',
                'accept-language': 'vi,vi-VN;q=0.9',
                'content-type': 'application/x-www-form-urlencoded',
                'origin': 'https://ttsave.app',
                'referer': 'https://ttsave.app/en',
                'sec-ch-ua': '"Not)A;Brand";v="99", "Google Chrome";v="127", "Chromium";v="127"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-origin',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',

            }
        });
        const $ = cheerio.load(data);
        const name = $('h2.font-extrabold.text-xl.text-center').text();
        const username = $('a[href^="https://www.tiktok.com/"]').text();
        const message = $('p.text-gray-600.px-2.text-center').text();
        const view = $('svg.text-gray-500').next('span').text();
        const like = $('svg.text-red-500').next('span').text();
        const comment = $('svg.text-green-500').next('span').text();
        const share = $('svg.text-yellow-500').next('span').text();
        const favorite = $('svg.text-blue-500').next('span').text();
        const soundName = $('div.flex-row.items-center.justify-center.gap-1.mt-5').text().trim();
        const audio = $('a[type="audio"]').attr('href');
        const attachments = [];
        if ($('div.flex.flex-col.text-center img').length > 0) {
            $('div.flex.flex-col.text-center img').each((i, elem) => {
                attachments.push({ type: 'Photo', url: $(elem).attr('src') });
            });
        } else {
            const videoLink = $('#button-download-ready a').attr('href');
            const videoType = $('#button-download-ready a').attr('type');
            if (videoLink && videoType === 'no-watermark') {
                attachments.push({ type: 'Video', url: videoLink });
            }
        }
        return {
            message,
            author: `${name} (${username})`,
            view,
            like,
            comment,
            share,
            favorite,
            soundName,
            audio,
            attachments,
        };
    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
};

module.exports = {
   search,
   searchUser,
   infov2,
   downloadv1
};