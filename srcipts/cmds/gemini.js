const axios = require('axios');
const Gemini = require('../../system/api/src/gemini.js');

this.config = {
  name: "gemini",
  aliases: ["gemini"],
  version: "1.0.0",
  role: 0,
  author: "DongDev",
  info: "Google Gemini Chat AI",
  Category: "AI",
  guides: "[question]",
  cd: 5,
  hasPrefix: true,
  images: [],
};

this.onRun = async function({ args, event, api, msg }) {
  try {
    if (args.length === 0 && event.type !== 'message_reply') {
      msg.reply({ body: "Xin chào! Hãy đặt câu hỏi cho tôi!" });
      return;
    }
    
    var query = args.join(' ');
    if (event.type === 'message_reply') {
      query += ' "' + event.messageReply.body + '"';
    }
    
    const req = new Gemini("g.a000igizKc-qo3UJeRcbDLcBDyZSsU50Xh_GXIPZrTUMTXr6NRLkXsRWE2ZKKaQhVl3NJD6eXAACgYKAawSAQASFQHGX2MifHKtiVb4MsLtXbrOaYhPTxoVAUF8yKoATS3G54efmbkwMn1rFyER0076");
    const post = {
      message: query,
      config: { format: Gemini.JSON },
    };
    const res = await req.ask(post.message, post.config);
    const img = res.images || [];
    
    let image = [];
    for (let i = 0; i < img.length; i++) {
      const a = img[i];
      const stream = await global.tools.streamURL(a.url, 'jpg');
      image.push(stream);
    }

    msg.reply({ body: res.content, attachment: image });
  } catch (error) {
    console.error(error);
    msg.reply("Đã xảy ra lỗi khi xử lý yêu cầu của bạn.");
  }
};