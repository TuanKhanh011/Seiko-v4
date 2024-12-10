this.config = {
    name: 'autodown',
    aliases: ["autodown"],
    version: '1.1.1',
    role: 3,
    author: 'DongDev',
    info: 'Tự động tải xuống khi phát hiện liên kết',
    Category: 'Tiện ích',
    guides: '[]',
    cd: 2,
    hasPrefix: true,
    images: [],
};
const axios = require('axios');
let musicSent = false;
function urlify(text) {
  const urlRegex = /(https?:\/\/[^\s]+)/gi;
  const matches = text.match(urlRegex);
  return matches || []; 
}
this.onEvent = async function({ api, event, msg }) {    
    if (event.senderID == (global.botID || api.getCurrentUserID())) return;
    const send = (a, b, c, d) => api.sendMessage(a, b || event.threadID, c || null, d || event.messageID);
    const head = app => `[ AUTODOWN - ${app} ]\n────────────────`;
    const urls = urlify(event.body);
    for (const str of urls) {
        if (/^https?:\/\/(?:vm\.|vt\.|v\.|www\.)?(?:tiktok)\.com\//.test(str)) {
    const res = await global.api.tiktok.downloadv1(str);
    if (res.attachments && res.attachments.length > 0) {
        let attachment = [];
        for (const attachmentItem of res.attachments) {
            if (attachmentItem.type === 'Video') {
                attachment.push(await global.tools.streamURL(attachmentItem.url, 'mp4'));
            } else if (attachmentItem.type === 'Photo') {
                attachment.push(await global.tools.streamURL(attachmentItem.url, 'jpg'));
            }
        }
        msg.reply({
            body: `${head('TIKTOK')}\n⩺ Tiêu đề: ${res.message || "null"}\n⩺ Lượt xem: ${res.view || 0}\n⩺ Lượt thích: ${res.like || 0}\n⩺ Bình luận: ${res.comment || 0}\n⩺ Lượt share: ${res.share || 0}\n⩺ Yêu thích: ${res.favorite || 0}\n⩺ Tác giả: ${res.author}\n⩺ Âm nhạc: ${res.soundName}\n⩺ Thả cảm xúc '😆' để tải nhạc`,
            attachment
        }, (err, dataMsg) => {
            global.Seiko.onReaction.push({
                name: this.config.name,
                messageID: dataMsg.messageID,
                title: res.soundName || "",
                url: res.audio,
                type: "TIKTOK"
            });
            musicSent = false;
        });
    }
} else if (/facebook\.com|fb\.watch/.test(str)) {
           const res = await global.api.facebook(encodeURIComponent(str));
           if (res.attachments && res.attachments.length > 0) {
           let attachment = [];
            if (res.queryStorieID) {
            const match = res.attachments.find(item => item.id == res.queryStorieID);
            if (match && match.type === 'Video') {
                const videoUrl = match.url.hd || match.url.sd;
                attachment.push(await global.tools.streamURL(videoUrl, 'mp4'));
              } else if (match && match.type === 'Photo') {
                const photoUrl = match.url;
                attachment.push(await global.tools.streamURL(photoUrl, 'jpg'));
                    
                }
             } else {
            for (const attachmentItem of res.attachments) {
                if (attachmentItem.type === 'Video') {
                    const videoUrl = attachmentItem.url.hd || attachmentItem.url.sd;
                    attachment.push(await global.tools.streamURL(videoUrl, 'mp4'));
                } else if (attachmentItem.type === 'Photo') {
                    attachment.push(await global.tools.streamURL(attachmentItem.url, 'jpg'));
                }
              }
           }
           msg.reply({ body: `${head('FACEBOOK')}\n⩺ Tiêu đề: ${res.message || "null"}\n${res.like ? `⩺ Lượt thích: ${res.like}\n` : ''}${res.comment ? `⩺ Bình luận: ${res.comment}\n` : ''}${res.share ? `⩺ Chia sẻ: ${res.share}\n` : ''}⩺ Tác giả: ${res.author || "unknown"}`.trim(), attachment });
            } else {
              continue;
            }
        } else if (/youtube|youtu/.test(str)) {
        const res = await global.api.youtube.downloadv1(str);
        msg.reply({
            body: `${head('YOUTUBE')}\n⩺ Title: ${res.title}\n⩺ Thời lượng: ${res.duration}`,
            attachment: await global.tools.streamURL(res.url, 'mp4')});
        } else if (/instagram/.test(str)) {
        const res = await global.api.instagram.download(str);
        let attachments = [];        
        if (res.attachments && res.attachments.length > 0) {
            for (const at of res.attachments) {
                if (at.type === 'Video') {
                    attachments.push(await global.tools.streamURL(at.url, 'mp4'));
                } else if (at.type === 'Photo') {
                    attachments.push(await global.tools.streamURL(at.url, 'jpg'));
                }
            }            
            msg.reply({body: `${head('INSTAGRAM')}\n⩺ Tiêu đề: ${res.message}\n⩺ Tác giả: ${res.author}\n⩺ Lượt thích: ${res.like}\n⩺ Bình luận: ${res.comment}`, attachment: attachments});
           }
        } else if (/capcut/.test(str)) {
            const chosenVideo = await global.api.capcut.downloadv2(str); 
            send({
                body: `${head('CAPCUT')}\n⩺ Tiêu đề: ${chosenVideo.short_title} ${chosenVideo.title}\n⩺ Tác giả: ${chosenVideo.author.name} (${chosenVideo.author.unique_id})\n⩺ Số ảnh cần dùng: ${chosenVideo.fragment_count}\n⩺ Lượt dùng mẫu: ${chosenVideo.usage_amount}\n⩺ Lượt xem: ${chosenVideo.play_amount}\n⩺ Lượt thích: ${chosenVideo.like_count}\n⩺ Bình luận: ${chosenVideo.comment_count}\n⩺ Lượt lưu: ${chosenVideo.favorite_count}`, 
                attachment: await global.tools.streamURL(chosenVideo.video_url, 'mp4')
            });
        } else if (/soundcloud/.test(str)) {
            const result = await global.api.scldlv2(str);
            send({
                body: `${head('SOUNDCLOUD')}\n⩺ Tiêu đề: ${result.title}\n⩺ Tác giả: ${result.author.username}`, 
                attachment: await global.tools.streamURL(result.url, 'mp3')
            });
        } else if (/threads\.net\//.test(str)) {
            let res = await global.api.threadsdl(str);
            let data = res.results;
            let vd = data.filter($ => $.type === 'video');
            let pt = data.filter($ => $.type === 'image');
            const s = attachment => send({ body: `${head('THREADS')}\n⩺ Tiêu đề: ${res.title}\n⩺ Tác giả: ${res.user.username}`, attachment });  
            Promise.all(vd.map($ => global.tools.streamURL($.url, 'mp4'))).then(r => r.filter($ => !!$).length > 0 ? s(r) : '');
            Promise.all(pt.map($ => global.tools.streamURL($.url, 'jpg'))).then(r => r.filter($ => !!$).length > 0 ? s(r) : '');
        } else if (/douyin/.test(str)) {
        let res = await global.api.douyindl(str);
        if (res.attachments && res.attachments.length > 0) {
        let attachment = [];
        for (const attachmentItem of res.attachments) {
            if (attachmentItem.type === 'Video') {
                attachment.push(await global.tools.streamURL(attachmentItem.url, 'mp4'));
            } else if (attachmentItem.type === 'Photo') {
                attachment.push(await global.tools.streamURL(attachmentItem.url, 'jpg'));
            }
        }
        msg.reply({body: `${head('DOUYIN')}\n⩺ Tiêu đề: ${res.title}\n⩺ Thả cảm xúc '😆' để tải nhạc`, attachment}, (error, info) => {
                global.Seiko.onReaction.push({
                    type: "DOUYIN",
                    name: this.config.name,
                    messageID: info.messageID,
                    author: event.senderID,
                    title: res.title,
                    url: res.audio
                 });
             });
          }
       } else if (/nhaccuatui/.test(str)) {
            const result = await global.api.nhaccuatuidl(str);
            send({
                body: `${head('NHACCUATUI')}\n⩺ Title: ${result.data.title}\n⩺ Artist: ${result.data.artist}`, 
                attachment: await global.tools.streamURL(result.data.source, 'mp3')
            });
        } else if (/zingmp3/.test(str)) {
            const result = await global.api.zingmp3dl(str);
            send({
                body: `${head('ZINGMP3')}\n⩺ Title: ${result.data.title}\n⩺ Artist: ${result.data.artist}`, 
                attachment: await global.tools.streamURL(result.data.source, 'mp3')
            });
        }
        // Thêm các điều kiện else if khác tại đây cho các trang web khác bạn muốn hỗ trợ download
    }
};
this.onReaction = async ({ api, event, onReaction, msg }) => {
    if (event.reaction == '😆' && !musicSent) {
        const _ = onReaction;
        if (_.type === "TIKTOK" || _.type === "DOUYIN" || _.type === "YOUTUBE") {
            msg.reply({
                body: `[ MUSIC ${_.type} ]\n────────────────\n⩺ Tiêu đề: ${_.title}`,
                attachment: await global.tools.streamURL(_.url, 'mp3')
            });
            musicSent = true;
        }
    }
};
this.onRun = async () => {};