const fs = require('fs-extra');
const path = require('path');
const logger = require("../../main/utils/log.js");
this.config = {
    name: "updateChecktt",
    eventType: ["log:unsubscribe"],
    version: "1.0.0",
    author: "DongDev",
    info: "Xóa dữ liệu tương tác khi người dùng hoặc bot thoát khỏi nhóm"
};
this.onRun = async function ({ event, api, Threads }) {
    try {
        const { threadID, logMessageData } = event;
        const { leftParticipantFbId } = logMessageData;
        const botID = api.getCurrentUserID();
        const threadInf = (await Threads.getData(threadID)).threadInfo;
        const checkttPath = path.join(__dirname, '../../system/data/messageCounts');
        const filePath = `${checkttPath}/${threadID}.json`;      
        if (fs.existsSync(filePath)) {
            if (leftParticipantFbId === botID) {
                fs.unlinkSync(filePath);
                logger(`Đã xóa dữ liệu tương tác của nhóm [${threadInf.threadName}] do bot rời khỏi nhóm`, "[ Cập Nhật ]");
            } else {
                let threadData = JSON.parse(fs.readFileSync(filePath));
                const userDataIndexes = {
                    total: threadData.total.findIndex(e => e.id === leftParticipantFbId),
                    week: threadData.week.findIndex(e => e.id === leftParticipantFbId),
                    day: threadData.day.findIndex(e => e.id === leftParticipantFbId),
                    month: threadData.month.findIndex(e => e.id === leftParticipantFbId)
                };              
                Object.keys(userDataIndexes).forEach(key => {
                    if (userDataIndexes[key] !== -1) {
                        threadData[key].splice(userDataIndexes[key], 1);
                    }
                });             
                fs.writeFileSync(filePath, JSON.stringify(threadData, null, 4));
                logger(`Đã xóa dữ liệu tương tác của người dùng ${leftParticipantFbId} trong nhóm [${threadInf.threadName}]`, "[ Cập Nhật ]");
            }
        }
    } catch (error) {
        console.error("Lỗi khi xóa dữ liệu tương tác:", error);
    }
};