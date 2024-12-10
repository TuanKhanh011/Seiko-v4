const fs = require('fs-extra');
const path = require('path');
const logger = require("../../main/utils/log.js");
this.config = {
    name: "updateChecktuvi",
    eventType: ["log:unsubscribe"],
    version: "1.0.0",
    author: "DongDev",
    info: "Xóa dữ liệu checktuvi khi người dùng hoặc bot thoát khỏi nhóm"
};
this.onRun = async function ({ event, api, Threads }) {
    try {
        const { threadID, logMessageData } = event;
        const { leftParticipantFbId } = logMessageData;
        const threadInf = (await Threads.getData(threadID)).threadInfo;
        const botID = api.getCurrentUserID();
        const checkttPath = path.join(__dirname, '../../system/data/checktuvi');
        const filePath = path.join(checkttPath, `${threadID}.json`);
        if (fs.existsSync(filePath)) {
            let threadData = JSON.parse(fs.readFileSync(filePath));
            if (leftParticipantFbId === botID) {
                fs.unlinkSync(filePath);
                logger(`Đã xóa dữ liệu checktuvi của nhóm: [${threadInf.threadName}] do bot rời khỏi nhóm`, "[ Cập Nhật ]");
            } else {
                if (threadData.hasOwnProperty(leftParticipantFbId)) {
                    delete threadData[leftParticipantFbId];
                    fs.writeFileSync(filePath, JSON.stringify(threadData, null, 4));
                    logger(`Đã xóa dữ liệu checktuvi của người dùng: ${leftParticipantFbId} trong nhóm [${threadInf.threadName}]`, "[ Cập Nhật ]");
                }
            }
        }
    } catch (error) {
        console.error("Lỗi khi xóa dữ liệu checktuvi:", error);
    }
};