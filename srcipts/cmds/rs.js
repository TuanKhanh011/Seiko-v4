this.config = {
   name: "rs",
   aliases: ["reset", "restart"],
   version: "1.0.0",
   role: 3,
   credits: "DongDev",
   description: "Khởi Động Lại Bot.",
   Category: "Admin",
   guides: "",
   cd: 0,
   hasPrefix: true,
   images: [],
};
this.onRun = ({event, api}) => api.sendMessage("🔄 Restarting!", event.threadID, () => process.exit(1), event.messageID)