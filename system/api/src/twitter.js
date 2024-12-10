const axios = require('axios');

async function downloadv1(url) {
    try {
        let input = {};
        if (typeof url === 'object') {
            if (url.url) input.url = url.url;
            else return { found: false, error: 'Không có URL nào được cung cấp' };
        } else if (typeof url === 'string') {
            input.url = url;
        } else {
            return { found: false, error: 'Đối số đầu tiên không hợp lệ' };
        }
        if (/twitter\.com|x\.com/.test(input.url)) {
            const apiURL = input.url.replace(/twitter\.com|x\.com/g, 'api.vxtwitter.com');
            const result = await axios.get(apiURL).then(res => res.data).catch(() => {
                throw new Error('Đã xảy ra sự cố. Đảm bảo liên kết Twitter hợp lệ.');
            });
            if (!result.media_extended) return { found: false, error: 'Không tìm thấy phương tiện nào' };
            return {
                type: result.media_extended[0].type,
                media: result.mediaURLs,
                title: result.text || 'Không có tiêu đề',
                id: result.conversationID,
                date: result.date,
                likes: result.likes,
                replies: result.replies,
                retweets: result.retweets,
                author: result.user_name,
                username: result.user_screen_name
            };
        } else {
            return { found: false, error: `URL không hợp lệ: ${input.url}` };
        }
    } catch (error) {
        return { found: false, error: error.message };
    }
};

module.exports = {
   downloadv1
};