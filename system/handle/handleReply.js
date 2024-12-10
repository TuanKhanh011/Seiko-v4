module.exports = function ({ api, models, Users, Threads, Currencies }) {
    return async function ({ event }) {
        if (!event.messageReply) return;
        const { onReply, commands } = global.Seiko;
        const { messageID, threadID, messageReply } = event;
        const msg = await global.utils.msg(api, event);

        if (onReply.length !== 0) {
            const indexOfHandle = onReply.findIndex(e => e.messageID == messageReply.messageID);
            if (indexOfHandle < 0) return;

            const handleObj = onReply[indexOfHandle];
            const handleNeedExec = commands.get(handleObj.name);

            if (!handleNeedExec) {
                return api.sendMessage("Thiếu giá trị name", threadID, messageID);
            }

            try {
                const Obj = {
                    api,
                    event,
                    models,
                    Users,
                    Threads,
                    Currencies,
                    onReply: handleObj,
                    msg
                };
                await handleNeedExec.onReply(Obj);
                return;
            } catch (error) {
                return api.sendMessage("Lỗi thực thi: " + error, threadID, messageID);
            }
        }
    };
};