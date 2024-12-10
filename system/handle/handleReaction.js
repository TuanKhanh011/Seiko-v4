module.exports = function ({ api, models, Users, Threads, Currencies }) {
    return async function ({ event }) {
        const { onReaction, commands } = global.Seiko;
        const { messageID, threadID } = event;
        let msg = await global.utils.msg(api, event);       
        if (onReaction.length !== 0) {
            const indexOfHandle = onReaction.findIndex(e => e.messageID == messageID);

            if (indexOfHandle < 0) return;

            const indexOfMessage = onReaction[indexOfHandle];
            const handleNeedExec = commands.get(indexOfMessage.name);

            if (!handleNeedExec) return api.sendMessage("Giá trị bị thiếu", threadID, messageID);

            try {
                const Obj = {
                    api: api,
                    event: event,
                    models: models,
                    Users: Users,
                    Threads: Threads,
                    Currencies: Currencies,
                    onReaction: indexOfMessage,
                    msg
                };

                handleNeedExec.onReaction(Obj);
                return;
            } catch (error) {
                return api.sendMessage("Lỗi khi thực thi", threadID, messageID);
            }
        }
    };
};