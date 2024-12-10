this.config = {
    name: "log",
    eventType: ["log:unsubscribe", "log:subscribe", "log:thread-name"],
    version: "1.0.0",
    author: "Mirai Team",
    info:  "Ghi lại thông báo các hoạt động của bot!",
    envConfig: {
        enable: true
    }
};
this.onRun = async function({ msg, api, event, Users, Threads }) {
    const { threadID, author, logMessageType, logMessageData } = event;
    const data = (await Threads.getData(threadID)).data || {};
    const logger = require("../../main/utils/log");
    if (!data.log || !global.configModule[this.config.name].envConfig.enable) return;
    let task = "";
    let formReport = `[ Bot Notification ]\n\n⩺ Thread ID: ${threadID}\n⩺ Hành động: {task}\n⩺ Thực hiện bởi: ${await getNameUser(Users, author)}`;
    switch (logMessageType) {
        case "log:thread-name": {
            const oldName = (await Threads.getData(threadID)).name || "Unknown";
            const newName = logMessageData.name || "Unknown";
            task = `Người dùng thay đổi tên nhóm từ ${oldName} thành ${newName}`;
            await Threads.setData(threadID, { name: newName });
            break;
        }
        case "log:subscribe": {
            const botUserID = api.getCurrentUserID();
            if (logMessageData.addedParticipants.some(i => i.userFbId === botUserID)) {
                task = "Người dùng thêm bot vào một nhóm mới!";
            }
            break;
        }
        case "log:unsubscribe": {
            const botUserID = api.getCurrentUserID();
            if (logMessageData.leftParticipantFbId === botUserID) {
                task = "Người dùng kick bot ra khỏi nhóm!";
            }
            break;
        }
        default:
            break;
    }
    if (!task) return;
    formReport = formReport.replace(/\{task}/g, task);
    api.sendMessage(formReport, global.config.NDH[0], (error, info) => {
        if (error) logger(formReport, "[ Logging Event ]");
    });
}
async function getNameUser(Users, userID) {
    try {
        const userInfo = await Users.getNameUser(userID);
        return userInfo.name || "Unknown";
    } catch (error) {
        return "Unknown";
    }
}