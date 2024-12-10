const fs = require('fs');
const path = require('path');
const logger = require("../../main/utils/log.js");

this.config = {
  name: "updateRent",
  eventType: ["log:unsubscribe"],
  version: "1.0.0",
  author: "DongDev",
  info: "Xóa dữ liệu rent khi bot thoát khỏi nhóm"
};

this.onRun = async function ({
  event,
  api,
  Threads
}) {
  try {
    const {
      threadID,
      logMessageData
    } = event;
    const {
      leftParticipantFbId
    } = logMessageData;
    const botID = api.getCurrentUserID();
    const checkRentPath = path.join(__dirname, '../../system/data/rent.json');
    if (fs.existsSync(checkRentPath)) {
      let threadData = JSON.parse(fs.readFileSync(checkRentPath, 'utf8'));
      if (leftParticipantFbId === botID) {
        threadData = threadData.filter(item => item.t_id !== threadID);
        fs.writeFileSync(checkRentPath, JSON.stringify(threadData, null, 2), 'utf8');
        logger(`Đã xóa dữ liệu rent của nhóm: ${threadID} do bot rời khỏi nhóm`, "[ Cập Nhật ]");
      }
    }
  } catch (error) {
    console.error("Lỗi khi xóa dữ liệu rent:", error);
  }
};