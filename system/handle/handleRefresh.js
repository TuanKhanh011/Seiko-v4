module.exports = function ({ api, models, Users, Threads, Currencies }) {
    const logger = require(process.cwd() + "/main/utils/log.js");
    return async function ({ event }) {
        const { threadID, logMessageType, logMessageData } = event;
        const { setData, getData, delData } = Threads;
        try {
            let threadData = await getData(threadID);
            if (!threadData || !threadData.threadInfo) {
                threadData = { threadInfo: {} };
            }
            let dataThread = threadData.threadInfo;
            switch (logMessageType) {
                case "log:subscribe": {
                    if (logMessageData.addedParticipants.some(i => i.userFbId == api.getCurrentUserID())) {
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        try {
                            require('./handleCreateDatabase.js');
                        } catch (e) {
                            logger(`Lỗi khi xử lý handleCreateDatabase: ${e}`, '[ ERROR ] >');
                        }
                        return;
                    } else {
                        for (const participant of logMessageData.addedParticipants) {
                            const userFbId = participant.userFbId;
                            const userfb = await api.getUserInfo(userFbId);
                            const userInfo = {
                                id: userFbId,
                                name: userfb[userFbId]?.name || "Unknown",
                                firstName: userfb[userFbId]?.firstName || "Unknown",
                                vanity: userfb[userFbId]?.vanity,
                                thumbSrc: userfb[userFbId]?.thumbSrc,
                                profileUrl: userfb[userFbId]?.profileUrl,
                                gender: userfb[userFbId]?.gender === 2 ? "MALE" : "FEMALE",
                                type: "User",
                                isFriend: userfb[userFbId]?.isFriend,
                                isBirthday: userfb[userFbId]?.isBirthday
                            };
                            if (!dataThread.participantIDs?.includes(userFbId)) {
                                dataThread.participantIDs = dataThread.participantIDs || [];
                                dataThread.participantIDs.push(userFbId);
                                logger(`Người dùng ${userfb[userFbId]?.name || "Unknown"} đã tham gia nhóm [ ${dataThread.threadName || "Unknown"} ]`, '[ CẬP NHẬT ] >');
                            }
                            if (!dataThread.userInfo) {
                                dataThread.userInfo = [];
                            }
                            dataThread.userInfo.push(userInfo);
                        }
                        await setData(threadID, { threadInfo: dataThread });
                    }
                    break;
                }
                case "log:thread-name": {
                    const newThreadName = logMessageData.name;
                    logger(`Cập Nhật Tên Nhóm Cho Nhóm: ${threadID}`, '[ DATABASE ]');
                    dataThread.threadName = newThreadName;
                    await setData(threadID, { threadInfo: dataThread });
                    break;
                }
                case "log:thread-admins": {
                    const targetID = logMessageData.TARGET_ID;
                    if (logMessageData.ADMIN_EVENT === "add_admin") {
                        dataThread.adminIDs = dataThread.adminIDs || [];
                        dataThread.adminIDs.push({ id: targetID });
                    } else if (logMessageData.ADMIN_EVENT === "remove_admin") {
                        dataThread.adminIDs = dataThread.adminIDs?.filter(item => item.id !== targetID) || [];
                    }
                    logger(`Update quản trị viên cho nhóm: ${threadID}`, '[ DATABASE ]');
                    await setData(threadID, { threadInfo: dataThread });
                    break;
                }
                case 'log:unsubscribe': {
                    if (logMessageData.leftParticipantFbId == api.getCurrentUserID()) {
                        logger(`Đã xóa dữ liệu của nhóm ${threadID}`, '[ CẬP NHẬT ]');
                        const index = global.data.allThreadID.findIndex(item => item == threadID);
                        if (index !== -1) {
                            global.data.allThreadID.splice(index, 1);
                        }
                        await delData(threadID);
                        return;
                    } else {
                        const idIndex = dataThread.participantIDs?.findIndex(item => item == logMessageData.leftParticipantFbId);
                        if (idIndex !== -1) {
                            dataThread.participantIDs.splice(idIndex, 1);
                        }

                        const userInfoIndex = dataThread.userInfo?.findIndex(user => user.id == logMessageData.leftParticipantFbId);
                        if (userInfoIndex !== -1) {
                            dataThread.userInfo.splice(userInfoIndex, 1);
                        }

                        logger(`Đã xóa dữ liệu người dùng ${await Users.getNameUser(logMessageData.leftParticipantFbId)} khỏi nhóm [ ${dataThread.threadName || "Unknown"} ]`, '[ CẬP NHẬT ]');
                        await setData(threadID, { threadInfo: dataThread });
                    }
                    break;
                }
                case "log:thread-approval-mode": {
                    const { APPROVAL_MODE } = logMessageData;
                    dataThread.approvalMode = APPROVAL_MODE === '1';
                    logger(`Chế độ phê duyệt của nhóm [ ${dataThread.threadName || "Unknown"} ] đã được cập nhật thành ${dataThread.approvalMode ? "bật" : "tắt"}`, '[ CẬP NHẬT ]');
                    await setData(threadID, { threadInfo: dataThread });
                    break;
                }
                case "log:thread-color": {
                    logger(`Chủ đề nhóm [ ${dataThread.threadName || "Unknown"} ] đã được cập nhật thành ${event.logMessageData.accessibility_label}`, '[ CẬP NHẬT ]');
                    dataThread.emoji = event.logMessageData.theme_emoji;
                    dataThread.threadTheme = {
                        id: logMessageData.theme_id,
                        accessibility_label: event.logMessageData.accessibility_label
                    };
                    dataThread.color = event.logMessageData.theme_color;
                    await setData(threadID, { threadInfo: dataThread });
                    break;
                }
                case "log:user-nickname": {
                    const { participant_id, nickname } = logMessageData;
                    dataThread.nicknames = dataThread.nicknames || {};
                    if (nickname === '') {
                        delete dataThread.nicknames[participant_id];
                        logger(`Biệt danh của ${participant_id} trong nhóm [ ${dataThread.threadName || "Unknown"} ] đã bị xóa`, '[ CẬP NHẬT ]');
                    } else {
                        dataThread.nicknames[participant_id] = nickname;
                        logger(`Biệt danh của ${participant_id} trong nhóm [ ${dataThread.threadName || "Unknown"} ] đã được cập nhật thành ${nickname}`, '[ CẬP NHẬT ]');
                    }
                    await setData(threadID, { threadInfo: dataThread });
                    break;
                }
                case "log:thread-icon": {
                    logger(`Biểu tượng nhóm [ ${dataThread.threadName || "Unknown"} ] đã được cập nhật thành ${event.logMessageData.thread_quick_reaction_emoji}`, '[ CẬP NHẬT ]');
                    dataThread.emoji = event.logMessageData.thread_quick_reaction_emoji;
                    await setData(threadID, { threadInfo: dataThread });
                    break;
                }
            }
        } catch (error) {
            logger(`Đã xảy ra lỗi khi cập nhật dữ liệu: ${error}`, '[ ERROR ] >');
        }
        return;
    };
};