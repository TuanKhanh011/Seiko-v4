const moment = require("moment-timezone");
const { readdirSync, readFileSync, writeFileSync, existsSync, unlinkSync, readJSONSync } = require("fs-extra");
const { join, resolve, extname } = require("path");
const logger = require("./main/utils/log.js");
const login = require("./login");
const fs = require('fs');
const chalk = require("chalkercli");
global.Seiko = {
  timeStart: Date.now() - process.uptime() * 1000,
  commands: new Map(),
  events: new Map(),
  cd: new Map(),
  eventRegistered: [],
  oneSchedule: [],
  onReaction: [],
  onReply: [],
  mainPath: process.cwd(),
  configPath: join(process.cwd(), '/main/json/config.json'),
  getTime: (option) => moment.tz("Asia/Ho_Chi_Minh").format({
    seconds: "ss",
    minutes: "mm",
    hours: "HH",
    date: "DD",
    month: "MM",
    year: "YYYY",
    fullHour: "HH:mm:ss",
    fullYear: "DD/MM/YYYY",
    fullTime: "HH:mm:ss DD/MM/YYYY"
  } [option]),
};
global.data = new Object({
    threadInfo: new Map(),
    threadData: new Map(),
    userName: new Map(),
    userBanned: new Map(),
    threadBanned: new Map(),
    commandBanned: new Map(),
    threadAllowNSFW: new Array(),
    allUserID: new Array(),
    allCurrenciesID: new Array(),
    allThreadID: new Array()
});
global.config = JSON.parse(readFileSync(global.Seiko.configPath, 'utf8'));
global.configModule = {};
global.moduleData = [];
global.utils = require("./main/utils");
global.api = require("./system/api");
global.tools = require("./system/tools.js");
global.account = {
  email: global.config.EMAIL,
  pass: global.config.PASSWORD,
  otpkey: global.config.OTPKEY,
  fbsate: fs.existsSync('./system/data/fbstate.json') ? JSON.parse(fs.readFileSync('./system/data/fbstate.json', 'utf8') || '[]') : (fs.writeFileSync('./system/data/fbstate.json', '[]'), JSON.parse('[]')),
  cookie: JSON.parse(readFileSync('./system/data/fbstate.json')).map(i => `${i.key}=${i.value}`).join(";"),
  token: {
    EAAAAU: JSON.parse(fs.readFileSync('./system/data/tokens.json', 'utf8')).EAAAAU,
    EAAD6V7: JSON.parse(fs.readFileSync('./system/data/tokens.json', 'utf8')).EAAD6V7
  }
};
global.anti = resolve(process.cwd(), 'system', 'data', 'antisetting.json');
function parseCookies(cookies) {
    const trimmed = cookies.includes('useragent=') ? cookies.split('useragent=')[0] : cookies;
    return trimmed.split(';').map(pair => {
            let [key, value] = pair.trim().split('=');
            if (value !== undefined) {
                return {
                    key,
                    value,
                    domain: "facebook.com",
                    path: "/",
                    hostOnly: false,
                    creation: new Date().toISOString(),
                    lastAccessed: new Date().toISOString()
                };
            }
        }).filter(item => item !== undefined);
}
const data = fs.readFileSync('./cookie.txt', 'utf8');
var appState = parseCookies(data);
async function onBot({ models }) {
  login({ appState: appState }, async (loginError, api) => {
      if (loginError) return logger(JSON.stringify(loginError), `ERROR`);
      api.setOptions(global.config.FCAOption);
      writeFileSync('./system/data/fbstate.json', JSON.stringify(api.getAppState(), null, 2));
      global.Seiko.api = api;
      global.config.version = '4.5.0';
      async function stream_url(url) {
        return require('axios')({
          url: url,
          responseType: 'stream',
        }).then(_ => _.data);
      };
      async function upload(url) {
        return api.postFormData('https://upload.facebook.com/ajax/mercury/upload.php', { upload_1024: await stream_url(url)}).then(res => Object.entries(JSON.parse(res.body.replace('for (;;);', '')).payload?.metadata?.[0] || {})[0]);
      };
      let status = false;
      var queues = [];
      setInterval(async () => {
         if (status === true) return;
         status = true;
         if (queues.length < 20) {
             const itemsNeeded = Math.min(20- queues.length, 5);
             const uploadPromises = [...Array(itemsNeeded)].map(() => upload(global.api.vdanime[Math.floor(Math.random() * global.api.vdanime.length)]));
             const res = await Promise.all(uploadPromises);
             console.log(res);
             queues.push(...res);
          }
          status = false;
      }, 1000 * 5);
      global.Seiko.queues = queues;
    (function () {
        const loadModules = (path, collection, disabledList, type) => {
          const items = readdirSync(path).filter(file => file.endsWith('.js') && !file.includes('example') && !disabledList.includes(file));
          let loadedCount = 0;   
          for (const file of items) {
            try {
              const item = require(join(path, file));
              const { config, onRun, onLoad, onEvent } = item;
      
              if (!config || !onRun || (type === 'commands' && !config.Category)) {
                throw new Error(`Lỗi định dạng trong ${type === 'commands' ? 'lệnh' : 'sự kiện'}: ${file}`);
              }  
              if (global.Seiko[collection].has(config.name)) {
                throw new Error(`Tên ${type === 'commands' ? 'lệnh' : 'sự kiện'} đã tồn tại: ${config.name}`);
              } 
              if (config.envConfig) {
                global.configModule[config.name] = global.configModule[config.name] || {};
                global.config[config.name] = global.config[config.name] || {};  
                for (const key in config.envConfig) {
                  global.configModule[config.name][key] = global.config[config.name][key] || config.envConfig[key] || '';
                  global.config[config.name][key] = global.configModule[config.name][key];
                }
              }
              if (onLoad) onLoad({ api, models });
              if (onEvent) global.Seiko.eventRegistered.push(config.name);
              global.Seiko[collection].set(config.name, item);
              loadedCount++;
            } catch (error) {
              console.error(`Lỗi khi tải ${type === 'commands' ? 'lệnh' : 'sự kiện'} ${file}:`, error);
            }
          }
          return loadedCount;
        };
        const commandPath = join(global.Seiko.mainPath, 'srcipts', 'cmds');
        const eventPath = join(global.Seiko.mainPath, 'srcipts', 'events');
        const loadedCommandsCount = loadModules(commandPath, 'commands', global.config.commandDisabled, 'commands');
        const loadedEventsCount = loadModules(eventPath, 'events', global.config.eventDisabled, 'events');
        logger.loader(`Loaded ${loadedCommandsCount} cmds - ${loadedEventsCount} events`);
      })();
      writeFileSync(global.Seiko.configPath, JSON.stringify(global.config, null, 4), 'utf8');
      const listener = require('./system/listen')({ api, models })
      logger("Auto check data rent đã hoạt động!", "[ RENT ]");
      setInterval(async () => await require("./main/checkRent.js")(api), 1000 * 60 * 30);
      async function refreshFb_dtsg() {
        try {
            await api.refreshFb_dtsg();
            logger("Đã làm mới fb_dtsg và jazoest thành công");
        } catch (err) {
            logger("error", "Đã xảy ra lỗi khi làm mới fb_dtsg và jazoest", err);
        }
    }
    setInterval(refreshFb_dtsg, 1000 * 60 * 60 * 48);
    function listenerCallback(error, event) {
    if (error) {
        if (JSON.stringify(error).includes("601051028565049")) {
            const form = {
                av: api.getCurrentUserID(),
                fb_api_caller_class: "RelayModern",
                fb_api_req_friendly_name: "FBScrapingWarningMutation",
                variables: "{}",
                server_timestamps: "true",
                doc_id: "6339492849481770",
            };
            api.httpPost("https://www.facebook.com/api/graphql/", form, (e, i) => {
                const res = JSON.parse(i);
                if (e || res.errors) return logger("Lỗi không thể xóa cảnh cáo của facebook", "error");
                if (res.data.fb_scraping_warning_clear.success) {
                    logger("Đã vượt cảnh cáo facebook thành công", "[ SUCCESS ]");
                    global.handleListen = api.listenMqtt(listenerCallback);
                    setTimeout(() => (global.mqttClient.end(), connect_mqtt()), 1000 * 60 * 60 * 4);
                }
            });
        } else if (error.error === 'Not logged in.') {
            logger.load('error', "Tài khoản bot của bạn đã bị đăng xuất!");
            return process.exit(1);
        } else if (error.error === 'Not logged in') {
            logger.load('error', "Tài khoản bị checkpoint, vui lòng đăng nhập lại!");
            return process.exit(0);
        } else {
            return logger('handleListener đã xảy ra một số lỗi không mong muốn, lỗi:', JSON.stringify(error), "error");
        }
    }
    if (["presence", "typ", "read_receipt"].some((data) => data === event?.type)) return;
    if (global.config.DeveloperMode) console.log(event);
    return listener(event);
}
function connect_mqtt() {
    global.mqttClient = api.listenMqtt(listenerCallback);
    setTimeout(() => (global.mqttClient.end(), connect_mqtt()), 1000 * 60 * 60 * 5);
}
connect_mqtt();
  });
}

function autoCleanCache() {
  const cachePath = "./srcipts/cmds/cache";
  const allowedExtensions = [".png", ".jpg", ".jpeg", ".mp4", ".mp3", ".m4a", ".ttf", ".gif", ".mov"];
  fs.readdir(cachePath, (err, files) => {
    if (err) {
      console.error('Lỗi khi đọc thư mục:', err);
      return;
    }
    files.forEach((file) => {
      const filePath = join(cachePath, file);
      if (allowedExtensions.includes(extname(file).toLowerCase())) {
        fs.unlink(filePath, (err) => {
          if (err) {
            logger('Không Thể Dọn Dẹp Cache', "[ SYSTEM ]");
          }
        });
      }
    });
    logger('Đã Dọn Dẹp Cache', "[ SYSTEM ]");
  });
}
autoCleanCache();
const rainbow = chalk.rainbow("\n██╗░░░░░███████╗██╗░░██╗██╗░░██╗░█████╗░███╗░░██╗██╗░░██╗\n██║░░░░░██╔════╝██║░██╔╝██║░░██║██╔══██╗████╗░██║██║░░██║\n██║░░░░░█████╗░░█████═╝░███████║███████║██╔██╗██║███████║\n██║░░░░░██╔══╝░░██╔═██╗░██╔══██║██╔══██║██║╚████║██╔══██║\n███████╗███████╗██║░╚██╗██║░░██║██║░░██║██║░╚███║██║░░██║\n╚══════╝╚══════╝╚═╝░░╚═╝╚═╝░░╚═╝╚═╝░░╚═╝╚═╝░░╚══╝╚═╝░░╚═╝\n").stop();
rainbow.render();
const frame = rainbow.frame();
console.log(frame);
(async () => {
  const { Sequelize, sequelize } = require("./main/db/data");
  try {
    await sequelize.authenticate();
    const authentication = {};
    authentication.Sequelize = Sequelize;
    authentication.sequelize = sequelize;
    const models = require('./main/db/data/model')(authentication);
    const botData = {};
    botData.models = models;
    logger("Kết nối đến cơ sở dữ liệu thành công", "[ DATABASE ]");
    await onBot(botData);
  } catch (error) {
    logger('Không thể kết nối đến cơ sở dữ liệu: ' + JSON.stringify(error), '[ DATABASE ]');
  }
})();
process.on('unhandledRejection', (err, p) => {}).on('uncaughtException', err => {
  console.log(err);
});