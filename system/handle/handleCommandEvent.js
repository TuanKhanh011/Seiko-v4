emodule.exports = function ({ api, models, Users, Threads, Currencies }) {
    const logger = require(process.cwd() + "/main/utils/log.js");
    return async function ({ event }) {
        const { allowInbox, NDH } = global.config;
        const { userBanned, threadBanned } = global.data;
        const { commands, eventRegistered } = global.Seiko;
        const msg = await global.utils.msg(api, event);
        const { senderID, threadID } = event;
        const fixUserIB = true;
        const isSenderInNDH = NDH.includes(String(senderID));
        if (!isSenderInNDH && (userBanned.has(String(senderID)) || threadBanned.has(String(threadID))) && fixUserIB) {
            return;
        }
        for (const eventReg of eventRegistered) {
            const cmd = commands.get(eventReg);
            try {
                const Obj = {
                    event,
                    api,
                    models,
                    Users,
                    Threads,
                    Currencies,
                    msg,
                };
                if (cmd) {
                    cmd.onEvent(Obj);
                }
            } catch (error) {
                console.log(error);
                logger(`Lỗi khi xử lý sự kiện của lệnh ${cmd.config.name}`, 'error');
            }
        }
    };
};