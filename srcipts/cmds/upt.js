const os = require('os');
const moment = require('moment-timezone');
const fs = require('fs').promises;
module.exports = {
  config: {
    name: "upt",
    aliases: ["uptime"],
    version: "2.1.6",
    role: 0,
    author: "Vtuan rmk Niio-team",
    info: "Hiển thị thông tin hệ thống của bot!",
    Category: "Hệ thống",
    guides: "",
    cd: 5,
    hasPrefix: false,
    images: []
  },
  onRun: async ({ api, event, Users }) => {
    const pingStart = Date.now();    
    async function getDependencyCount() {
      try {
        const { dependencies } = JSON.parse(await fs.readFile('package.json', 'utf8'));
        return Object.keys(dependencies).length;
      } catch (error) {
        console.error('❎ Không thể đọc file package.json:', error);
        return -1;
      }
    }
    function formatUptime(seconds) {
      const days = Math.floor(seconds / (24 * 3600));
      const hours = Math.floor((seconds % (24 * 3600)) / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = Math.floor(seconds % 60);
      return `${days}d : ${hours.toString().padStart(2, '0')}h : ${minutes.toString().padStart(2, '0')}m : ${secs.toString().padStart(2, '0')}s`;
    }
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const { heapTotal, heapUsed, external, rss } = process.memoryUsage();
    const uptime = process.uptime();
    const dependencyCount = await getDependencyCount();
    const pingReal = Date.now() - pingStart;
    const botStatus = pingReal < 200 ? 'mượt' : (pingReal < 600 ? 'trung bình' : 'lag');
    const cpus = os.cpus();
    const name = await Users.getNameUser(event.senderID);
    api.sendMessage({body: `⩺ Bây giờ là: ${moment().tz('Asia/Ho_Chi_Minh').format('HH:mm:ss')} | ${moment().tz('Asia/Ho_Chi_Minh').format('DD/MM/YYYY')}\n⩺ Thời gian hoạt động: ${formatUptime(uptime)}\n⩺ Dấu lệnh mặc định: ${global.config.PREFIX}\n⩺ Số lượng package: ${dependencyCount >= 0 ? dependencyCount : "Không xác định"}\n⩺ Tình trạng bot: ${botStatus}\n⩺ Hệ điều hành: ${os.type()} ${os.release()} (${os.arch()})\n⩺ CPU: ${cpus.length} core(s) - ${cpus[0].model} @ ${Math.round(cpus[0].speed)}MHz\n⩺ RAM: ${((totalMemory - freeMemory) / (1024 ** 3)).toFixed(2)}GB/${(totalMemory / (1024 ** 3)).toFixed(2)}GB (đã dùng)\n⩺ Ram trống: ${(freeMemory / (1024 ** 3)).toFixed(2)}GB\n⩺ Heap Memory: ${(heapUsed / (1024 ** 2)).toFixed(2)}MB / ${(heapTotal / (1024 ** 2)).toFixed(2)}MB (đã dùng)\n⩺ External Memory: ${(external / (1024 ** 2)).toFixed(2)}MB\n⩺ RSS: ${(rss / (1024 ** 2)).toFixed(2)}MB\n⩺ Ping: ${pingReal}ms\n⩺ Yêu cầu bởi: ${name}`, attachment: global.Seiko.queues.splice(0, 1)},event.threadID, event.messageID);
  }
};