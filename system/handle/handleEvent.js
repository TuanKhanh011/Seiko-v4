module.exports = function ({ api, models, Users, Threads, Currencies }) {
    const logger = require(process.cwd() + "/main/utils/log.js");
    const moment = require("moment");
    return async function ({ event }) {
        let msg = await global.utils.msg(api, event);
        const timeStart = Date.now();
        const time = moment.tz("Asia/Ho_Chi_Minh").format("HH:mm:ss L");
        const { userBanned, threadBanned } = global.data;
        const { events } = global.Seiko;
        const { allowInbox, DeveloperMode, NDH } = global.config;
        let { senderID, threadID } = event;
        senderID = String(senderID);
        threadID = String(threadID);
        const isSenderInNDH = NDH.includes(senderID);
        if (!isSenderInNDH && (userBanned.has(senderID) || threadBanned.has(threadID) || (!allowInbox && senderID === threadID))) {
            return;
        }
        for (const [key, value] of events.entries()) {
            if (value.config.eventType.includes(event.logMessageType)) {
                const eventRun = events.get(key);
                try {
                    const Obj = {
                        api,
                        event,
                        models,
                        Users,
                        Threads,
                        Currencies,
                        msg
                    };
                    eventRun.onRun(Obj);
                    if (DeveloperMode) {
                        logger(`Đang thực thi sự kiện ${eventRun.config.name} vào lúc ${time} trong nhóm ${threadID}. Thời gian thực hiện: ${Date.now() - timeStart}ms`, '[ Sự kiện ]');
                    }
                } catch (error) {
                    logger(`Đã xảy ra lỗi trong quá trình thực thi sự kiện ${eventRun.config.name}: ${JSON.stringify(error)}`, "error");
                }
            }
        }
    };
};