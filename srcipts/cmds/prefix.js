module.exports.config = {
	name: "setprefix",
	version: "2.0.7",
	role: 1,
	author: "BraSL",
	info: "Đặt lại prefix của nhóm",
	Category: "Box chat",
	guides: "[prefix/reset]",
	cd: 5
};

const uid = [
  "100087652159146",
  "100085130240990"
]

module.exports.onEvent = async ({ api, event, Threads }) => {
  if (!event.body) return;
  var { threadID, messageID } = event;
  if (event.body.toLowerCase() == "prefix")  {
    //khỏi chỉnh
    const threadSetting = (await Threads.getData(String(threadID))).data || {};
    const prefix = (threadSetting.hasOwnProperty("PREFIX")) ? threadSetting.PREFIX : global.config.PREFIX;

  api.sendMessage({body: `🚨 Prefix của hệ thống [ ${global.config.PREFIX} ]\n🏘️ Prefix của nhóm bạn [ ${prefix} ]`, attachment: global.Seiko.queues.splice(0, 1)},threadID, messageID);
  }
}
module.exports.onReaction = async function({ api, event, Threads, onReaction, getText }) {
	try {
		if (event.userID != onReaction.author) return;
		const { threadID, messageID } = event;
		var data = (await Threads.getData(String(threadID))).data || {};
		data["PREFIX"] = onReaction.PREFIX;
		await Threads.setData(threadID, { data });
		await global.data.threadData.set(String(threadID), data);
		api.unsendMessage(onReaction.messageID);

    for(const i of uid){
       api.changeNickname(`>>${onReaction.PREFIX}<< • ${global.config.BOTNAME}`,event.threadID, i);
    }
    
		return api.sendMessage(`✅ Đã chuyển đổi prefix của nhóm thành: ${handleReaction.PREFIX}`, threadID, messageID);
    
	} catch (e) { return console.log(e) }
}

module.exports.onRun = async ({ api, event, args, Threads }) => {
  
	let prefix = args[0].trim();
	if (!prefix) return api.sendMessage('❎ Phần prefix cần đặt không được để trống', event.threadID, event.messageID);
  
	if (prefix === "reset") {
		var data = (await Threads.getData(event.threadID)).data || {};
		data["PREFIX"] = global.config.PREFIX;
		await Threads.setData(event.threadID, { data });
		await global.data.threadData.set(String(event.threadID), data);
    for(const i of uid){
       api.changeNickname(`[ ${global.config.PREFIX} ] • ${global.config.BOTNAME}`,event.threadID, i);
    }
		return api.sendMessage(`✅ Đã reset prefix về mặc định: ${global.config.PREFIX}`, event.threadID, event.messageID);
	} else {
    return api.sendMessage(`Bạn muốn đổi prefix thành: ${prefix}\nThả cảm xúc để xác nhận`, event.threadID, (error, info) => {
		global.Seiko.onReaction.push({
			name: "setprefix",
			messageID: info.messageID,
			author: event.senderID,
			PREFIX: prefix
		})
	})
  }
}