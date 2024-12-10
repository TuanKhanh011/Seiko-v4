this.config = {
    name: "updateQtv",
    eventType: ["log:thread-admins"],
    version: "1.0.1",
    author: "DongDev",
    info: "Auto làm mới danh sách qtv nhóm",
};
this.onRun = async function({ event: { threadID, logMessageType}, api: { getThreadInfo } , Threads, msg }) {
    switch (logMessageType) {
        case "log:thread-admins": {
            const threadInfo = await getThreadInfo(threadID);
            const qtvCount = threadInfo.adminIDs.length;
            await Threads.setData(threadID, { threadInfo });
            global.data.threadInfo.set(threadID, threadInfo);
            return msg.send(`✅ Auto Update ${qtvCount} Quản trị viên!`);
        }
    }
};