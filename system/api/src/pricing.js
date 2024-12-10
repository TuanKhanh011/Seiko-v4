const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async function (phone) {
  function generateCookie() {
    const ga = `GA1.1.${Math.floor(Math.random() * 1e10)}.${Math.floor(Date.now() / 1000)}`;
    const gads = `ID=${Math.random().toString(36).substr(2, 16)}:T=${Math.floor(Date.now() / 1000)}:RT=${Math.floor(Date.now() / 1000)}:S=ALNI_${Math.random().toString(36).substr(2, 10)}`;
    const gpi = `UID=${Math.random().toString(36).substr(2, 16)}:T=${Math.floor(Date.now() / 1000)}:RT=${Math.floor(Date.now() / 1000)}:S=ALNI_${Math.random().toString(36).substr(2, 10)}`;
    const eoi = `ID=${Math.random().toString(36).substr(2, 16)}:T=${Math.floor(Date.now() / 1000)}:RT=${Math.floor(Date.now() / 1000)}:S=AA-${Math.random().toString(36).substr(2, 10)}`;
    const ga_H3E6FXCTL9 = `GS1.1.${Math.floor(Date.now() / 1000)}.1.1.${Math.floor(Date.now() / 1000)}.0.0.0`;
    const pageloadcount = '';
    const adsloadcount = '2';
    const db89 = '6';
    return `_ga=${ga}; __gads=${gads}; __gpi=${gpi}; __eoi=${eoi}; _ga_H3E6FXCTL9=${ga_H3E6FXCTL9}; pageloadcount=${pageloadcount}; adsloadcount=${adsloadcount}; _db89=${db89}`;
  }
  function formatNumber(number) {
    if (isNaN(number)) {
        return null;
    }
    return number.toLocaleString('de-DE');
  }
  const cleanText = (htmlString) => {
    let text = htmlString.replace(/<[^>]*>/g, '');
    return text.replace(/\s+/g, ' ').trim();
  };
  try {
    const {
      data
    } = await axios({
      method: 'post',
      url: 'https://dinhgiasimonline.vn/mua-sim-so-dep',
      headers: {
        'authority': 'dinhgiasimonline.vn',
        'method': 'POST',
        'path': '/mua-sim-so-dep',
        'scheme': 'https',
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'accept-encoding': 'gzip, deflate, br, zstd',
        'accept-language': 'vi,vi-VN;q=0.9',
        'cache-control': 'max-age=0',
        'content-type': 'application/x-www-form-urlencoded',
        'cookie': generateCookie(),
        'origin': 'https://dinhgiasimonline.vn',
        'priority': 'u=0, i',
        'referer': 'https://dinhgiasimonline.vn/',
        'sec-ch-ua': '"Not)A;Brand";v="99", "Google Chrome";v="127", "Chromium";v="127"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'document',
        'sec-fetch-mode': 'navigate',
        'sec-fetch-site': 'same-origin',
        'sec-fetch-user': '?1',
        'upgrade-insecure-requests': '1',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36'
      },
      data: new URLSearchParams({
        fname: phone,
        submit_button: ''
      })
    });
    const $ = cheerio.load(data);
    const sdt = $('.section-title-h1').text().trim();
    const network = $('.nhamang_card span').text().trim();
    const price = $('.price_sdt .counter').attr('data-count');
    const priceText = $('.price_text').text().trim();
    const description = $('.frame_sdt_ynghia .sologun').text().trim();
    const details = {
      sdt,
      network,
      price: `${formatNumber(price)} ${cleanText(priceText)}`,
      description,
      features: [],
      results: {}
    };
    $('#dinhgia_SIM .frame_sdt_ynghia p').each((i, el) => {
      const text = $(el).text().trim();
      if (text.startsWith('»')) {
        details.features.push(text);
      }
    });
     $('h2').each((index, element) => {
    const title = $(element).text().trim();
    const cleanedTitle = title.replace(/^\d+\s*/, '').trim();
    const content = [];
    $(element).nextUntil('h2').each((i, el) => {
        if ($(el).is('p')) {
            content.push($(el).text().trim());
        }
    });
    details.results[cleanedTitle] = content.join('\n');
});
    return details;
  } catch (error) {
    console.error(error);
  }
}