const fs = require('fs-extra');
this.config = {
    name: "antitheme",
    eventType: ["log:thread-color"],
    version: "1.0.1",
    author: "DongDev",
    info: "Chống đổi chủ đề nhóm",
};
this.onRun = async function ({ event, api, Threads, Users }) {
    try {
        const { threadID, logMessageType, logMessageData, author } = event;
        var data_anti = JSON.parse(fs.readFileSync(global.anti, "utf8"));
        let alertSent = false;
        const threadInfo = await Threads.getInfo(threadID);
        const adminIDs = threadInfo.adminIDs.map(admin => admin.id);
        const botID = api.getCurrentUserID();
        const isAdminOrBot = adminIDs.includes(author) || author === botID;
        if (isAdminOrBot) {
            const data = data_anti.antiTheme;
            const theme = logMessageData.theme_id;
            data[threadID] = {
                themeid: theme,
                enabled: data[threadID] ? data[threadID].enabled : true
            };
          fs.writeFileSync(global.anti, JSON.stringify(data_anti, null, 4));
          } else {
        if (!alertSent) {
          const data = data_anti.antiTheme;
          const currentData = data[threadID];
       if (currentData && currentData.enabled) {
          const currentTheme = currentData.themeid;
          await api.changeThreadColor(currentTheme, threadID);
          await api.sendMessage(`⚠️ Bạn không có quyền đổi chủ đề nhóm`, threadID);                    
                    alertSent = true;
                    setTimeout(() => {
                        alertSent = false;
                    }, 1000);
                }
            }
        }
    } catch (error) {
        console.error(error);
    }
}